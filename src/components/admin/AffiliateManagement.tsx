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
  Plus
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

  // Payout Modal State
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutForm, setPayoutForm] = useState({
    partner_id: '',
    amount: '',
    payout_method: 'bank_transfer',
    notes: '',
  });

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
        body: JSON.stringify(payoutForm),
      });
      const data = await res.json();
      if (data.success) {
        setShowPayoutModal(false);
        setPayoutForm({ partner_id: '', amount: '', payout_method: 'bank_transfer', notes: '' });
        fetchAllData();
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

  // Quick Open Payout Modal pre-filled for partner
  const openQuickPayoutForPartner = (partner: any) => {
    const metrics = getPartnerMetrics(partner);
    setPayoutForm({
      partner_id: partner.id,
      amount: metrics.approvedUnpaid > 0 ? String(metrics.approvedUnpaid) : '',
      payout_method: partner.payout_method || 'bank_transfer',
      notes: partner.business_name ? `Payout for ${partner.business_name}` : `Partner payout`,
    });
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
      
      {/* PRIMARY HEADER SECTION: BLACK BACKGROUND WITH WHITE TITLE */}
      <div className="bg-black text-white p-6 rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                BookTherapick Affiliate & Partner Management
              </h1>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-white/10 text-white border border-white/20 font-mono uppercase tracking-wider">
                Therapick Domain
              </span>
            </div>
            <p className="text-xs text-white/60 mt-1">
              Manage approved referral partners, review commissions, and record payouts
            </p>
          </div>

          {/* Clean Monochrome Tabs (No decorative icons) */}
          <div className="flex items-center gap-1 bg-white/10 p-1 rounded-xl shrink-0">
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
                  onClick={() => setSubTab(tab.id as any)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-white text-black shadow-sm'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isActive ? 'bg-black text-white' : 'bg-white/20 text-white'}`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* SUB-TAB 1: PARTNERS (MAIN TABLE) */}
      {subTab === 'partners' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-black/10 shadow-sm">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-black/40 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search partner by code, name, villa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-black/15 focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div className="flex items-center gap-1 text-xs">
              {['all', 'pending', 'active', 'suspended', 'rejected'].map((st) => (
                <button
                  key={st}
                  onClick={() => setPartnerStatusFilter(st)}
                  className={`px-3 py-1 rounded-lg capitalize font-medium transition-colors ${
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

          <div className="bg-white rounded-2xl border border-black/10 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-black text-white font-semibold">
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

                          {/* 3. Commission (Independent) */}
                          <td className="py-3.5 px-4 align-top">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-black text-xs">
                                  {formatIDR(metrics.totalEarned)}
                                </span>
                                {editingRateId === p.id ? (
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="number"
                                      min={1}
                                      max={100}
                                      value={newRateValue}
                                      onChange={(e) => setNewRateValue(Number(e.target.value))}
                                      className="w-12 px-1 py-0.5 border border-black/20 rounded text-xs"
                                    />
                                    <button
                                      onClick={() => handleSaveCommissionRate(p.id)}
                                      className="p-1 bg-black text-white rounded hover:bg-black/80"
                                      title="Save rate"
                                    >
                                      <Check size={11} />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setEditingRateId(p.id);
                                      setNewRateValue(p.commission_rate_pct);
                                    }}
                                    className="text-[10px] font-semibold text-black bg-black/5 px-1.5 py-0.5 rounded border border-black/10 flex items-center gap-1 hover:bg-black/10"
                                    title="Edit rate %"
                                  >
                                    <span>{p.commission_rate_pct}%</span>
                                    <Edit2 size={9} className="opacity-50" />
                                  </button>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5 flex-wrap">
                                {metrics.approvedUnpaid > 0 ? (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-black/5 text-black border border-black/10">
                                    {formatIDR(metrics.approvedUnpaid)} unpaid
                                  </span>
                                ) : metrics.pending > 0 ? (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded font-medium text-black/70 bg-black/5 border border-black/10">
                                    {formatIDR(metrics.pending)} pending
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-black/40">Settled</span>
                                )}

                                <button
                                  onClick={() => openPartnerModal(p, 'commissions')}
                                  className="text-[10px] text-black font-bold hover:underline"
                                >
                                  {metrics.commissions.length} {metrics.commissions.length === 1 ? 'comm' : 'comms'} &rarr;
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-black/10 shadow-sm text-xs">
            <div className="flex items-center gap-3">
              <span className="font-bold text-black">Filter Status:</span>
              <div className="flex items-center gap-1">
                {['all', 'pending', 'approved', 'paid', 'declined'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setCommissionStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-lg capitalize font-medium ${
                      commissionStatusFilter === st
                        ? 'bg-black text-white'
                        : 'text-black/60 hover:bg-black/5'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-bold text-black">Partner:</span>
              <select
                value={globalPartnerFilter}
                onChange={(e) => setGlobalPartnerFilter(e.target.value)}
                className="px-2.5 py-1 rounded-lg border border-black/15 bg-white text-xs font-medium"
              >
                <option value="all">All Partners ({partners.length})</option>
                {partners.map((p) => (
                  <option key={p.id} value={p.partner_code}>
                    {p.partner_code} - {p.first_name} {p.last_name} ({p.business_name || 'Individual'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-black/10 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-black text-white font-semibold">
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
                          <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-black/5 text-black border border-black/10">
                            {c.status}
                          </span>
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-black/10 shadow-sm">
            <div>
              <h3 className="font-bold text-black text-sm">Partner Commission Payouts</h3>
              <p className="text-xs text-black/60">Record transfers to close out approved partner earnings</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-black">Filter Partner:</span>
                <select
                  value={globalPayoutPartnerFilter}
                  onChange={(e) => setGlobalPayoutPartnerFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-black/15 bg-white text-xs font-medium"
                >
                  <option value="all">All Partners ({partners.length})</option>
                  {partners.map((p) => (
                    <option key={p.id} value={p.partner_code}>
                      {p.partner_code} - {p.first_name} {p.last_name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => {
                  setPayoutForm({ partner_id: '', amount: '', payout_method: 'bank_transfer', notes: '' });
                  setShowPayoutModal(true);
                }}
                className="px-4 py-2 bg-black text-white rounded-xl text-xs font-bold hover:bg-black/80 shadow-sm"
              >
                + Record New Payout
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-black/10 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-black text-white font-semibold">
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

      {/* RECORD PAYOUT MODAL */}
      {showPayoutModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleRecordPayout}
            className="bg-white rounded-2xl max-w-md w-full border border-black/10 shadow-2xl overflow-hidden"
          >
            <div className="bg-black text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-white text-sm">Record Partner Payout</h3>
              <button
                type="button"
                onClick={() => setShowPayoutModal(false)}
                className="text-white/70 hover:text-white p-1"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-black mb-1">Select Partner *</label>
                <select
                  required
                  value={payoutForm.partner_id}
                  onChange={(e) => {
                    const pid = e.target.value;
                    const partner = partners.find((p) => p.id === pid);
                    const pStats = partner ? getPartnerMetrics(partner) : null;
                    setPayoutForm({
                      ...payoutForm,
                      partner_id: pid,
                      amount: pStats && pStats.approvedUnpaid > 0 ? String(pStats.approvedUnpaid) : payoutForm.amount,
                      payout_method: partner?.payout_method || 'bank_transfer',
                    });
                  }}
                  className="w-full px-3 py-2 border border-black/20 rounded-xl text-xs bg-white"
                >
                  <option value="">-- Choose Partner --</option>
                  {partners.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.partner_code} - {p.first_name} {p.last_name} ({p.business_name || 'Individual'})
                    </option>
                  ))}
                </select>
              </div>

              {payoutForm.partner_id && (() => {
                const p = partners.find((item) => item.id === payoutForm.partner_id);
                if (!p) return null;
                const metrics = getPartnerMetrics(p);
                return (
                  <div className="bg-black/[0.03] p-3 rounded-xl border border-black/10 text-[11px] space-y-1">
                    <div className="flex justify-between">
                      <span className="text-black/60">Approved Unpaid Balance:</span>
                      <span className="font-bold text-black">{formatIDR(metrics.approvedUnpaid)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-black/60">Payout Method:</span>
                      <span className="font-semibold text-black capitalize">{p.payout_method?.replace('_', ' ')}</span>
                    </div>
                    {p.payout_details?.bank_name && (
                      <div className="flex justify-between">
                        <span className="text-black/60">Bank Account:</span>
                        <span className="font-mono font-semibold text-black">
                          {p.payout_details.bank_name} - {p.payout_details.account_number} ({p.payout_details.account_holder})
                        </span>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div>
                <label className="block text-xs font-semibold text-black mb-1">Payout Amount (IDR) *</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 750000"
                  value={payoutForm.amount}
                  onChange={(e) => setPayoutForm({ ...payoutForm, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-black/20 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-black mb-1">Payment Method</label>
                <select
                  value={payoutForm.payout_method}
                  onChange={(e) => setPayoutForm({ ...payoutForm, payout_method: e.target.value })}
                  className="w-full px-3 py-2 border border-black/20 rounded-xl text-xs bg-white"
                >
                  <option value="bank_transfer">Indonesian Bank Transfer</option>
                  <option value="wise">Wise</option>
                  <option value="paypal">PayPal</option>
                  <option value="cash">Cash Settlement</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-black mb-1">Notes / Transfer Reference</label>
                <input
                  type="text"
                  placeholder="e.g. BCA Ref #88392102"
                  value={payoutForm.notes}
                  onChange={(e) => setPayoutForm({ ...payoutForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-black/20 rounded-xl text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-2 bg-black text-white text-xs font-bold rounded-xl hover:bg-black/80"
                >
                  Confirm Payout
                </button>
                <button
                  type="button"
                  onClick={() => setShowPayoutModal(false)}
                  className="px-4 py-2 border border-black/20 text-xs font-semibold rounded-xl hover:bg-black/5"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* INDEPENDENT PARTNER DETAILS & CALENDAR MODAL (BLACK BG HEADER & WHITE TITLE) */}
      {selectedPartnerDetails && activePartnerMetrics && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col border border-black/20 shadow-2xl overflow-hidden">
            
            {/* Modal Header: Black Background with White Title */}
            <div className="p-5 bg-black text-white flex items-start justify-between shrink-0">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="font-bold text-white text-lg tracking-tight">
                    {selectedPartnerDetails.first_name} {selectedPartnerDetails.last_name || ''}
                  </h3>
                  <span className="font-mono font-bold text-white bg-white/10 px-2 py-0.5 rounded text-xs border border-white/20">
                    {selectedPartnerDetails.partner_code}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/15 text-white border border-white/20">
                    {selectedPartnerDetails.status}
                  </span>
                </div>
                <div className="text-xs text-white/60 mt-1 flex items-center gap-2 flex-wrap">
                  {selectedPartnerDetails.business_name && (
                    <span className="text-white/80 font-medium">{selectedPartnerDetails.business_name}</span>
                  )}
                  <span>&bull;</span>
                  <span>Rate: <strong className="text-white">{selectedPartnerDetails.commission_rate_pct}%</strong></span>
                  <span>&bull;</span>
                  <span>Joined: {new Date(selectedPartnerDetails.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedPartnerDetails(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white hover:text-black text-white flex items-center justify-center transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Sub-Tabs: Clean Monochrome (No AI icons) */}
            <div className="flex items-center gap-1 border-b border-black/10 px-6 pt-2 bg-black/[0.02] shrink-0">
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
                    className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
                      isActive
                        ? 'border-black text-black bg-white rounded-t-xl'
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

              {/* TAB B: INDEPENDENT PARTNER CALENDAR */}
              {partnerActiveTab === 'calendar' && (
                <div className="space-y-5 text-xs">
                  
                  {/* Calendar Top Controls */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-black/[0.03] p-3.5 rounded-2xl border border-black/10">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          if (partnerCalendarMonth === 0) {
                            setPartnerCalendarMonth(11);
                            setPartnerCalendarYear((y) => y - 1);
                          } else {
                            setPartnerCalendarMonth((m) => m - 1);
                          }
                          setPartnerSelectedDate(null);
                        }}
                        className="w-8 h-8 rounded-xl bg-white border border-black/15 flex items-center justify-center hover:bg-black/5"
                        title="Previous Month"
                      >
                        <ChevronLeft size={16} />
                      </button>

                      <div className="font-bold text-black text-sm px-2">
                        {MONTH_NAMES[partnerCalendarMonth]} {partnerCalendarYear}
                      </div>

                      <button
                        onClick={() => {
                          if (partnerCalendarMonth === 11) {
                            setPartnerCalendarMonth(0);
                            setPartnerCalendarYear((y) => y + 1);
                          } else {
                            setPartnerCalendarMonth((m) => m + 1);
                          }
                          setPartnerSelectedDate(null);
                        }}
                        className="w-8 h-8 rounded-xl bg-white border border-black/15 flex items-center justify-center hover:bg-black/5"
                        title="Next Month"
                      >
                        <ChevronRight size={16} />
                      </button>

                      <button
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

                    <div className="text-[11px] text-black/60">
                      Month Summary: <strong className="text-black">{partnerMonthBookings.length}</strong> bookings, <strong className="text-black">{formatIDR(partnerMonthBookings.reduce((sum, b) => sum + Number(b.commission_amount || 0), 0))}</strong> commission
                    </div>
                  </div>

                  {/* Clean Monochrome Calendar Grid */}
                  <div className="bg-white rounded-2xl border border-black/10 p-3 sm:p-4 shadow-xs">
                    <div className="grid grid-cols-7 gap-1 text-center font-bold text-black/40 text-[11px] mb-2">
                      {DAYS_OF_WEEK.map((d) => (
                        <div key={d} className="py-1">{d}</div>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1.5">
                      {Array.from({ length: calendarFirstDayOfWeek }).map((_, i) => (
                        <div key={`empty-${i}`} className="h-16 sm:h-20 bg-black/[0.01] rounded-xl" />
                      ))}

                      {Array.from({ length: calendarDaysInMonth }).map((_, i) => {
                        const dayNum = i + 1;
                        const dateStr = `${partnerCalendarYear}-${String(partnerCalendarMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                        const dayBookings = partnerBookingsByDate[dateStr] || [];
                        const isSelected = partnerSelectedDate === dateStr;
                        const todayStr = new Date().toISOString().split('T')[0];
                        const isToday = dateStr === todayStr;

                        return (
                          <div
                            key={dateStr}
                            onClick={() => setPartnerSelectedDate(isSelected ? null : dateStr)}
                            className={`h-16 sm:h-20 p-1.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                              isSelected
                                ? 'bg-black text-white border-black shadow-sm'
                                : dayBookings.length > 0
                                ? 'bg-black/5 border-black/30 hover:border-black'
                                : 'bg-white border-black/10 hover:border-black/30'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span
                                className={`text-[11px] font-bold w-5 h-5 flex items-center justify-center rounded-full ${
                                  isToday && !isSelected ? 'bg-black text-white' : ''
                                }`}
                              >
                                {dayNum}
                              </span>
                              {dayBookings.length > 0 && (
                                <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                                  isSelected ? 'bg-white text-black' : 'bg-black text-white'
                                }`}>
                                  {dayBookings.length}
                                </span>
                              )}
                            </div>

                            {dayBookings.length > 0 ? (
                              <div className={`text-[9px] font-bold truncate ${isSelected ? 'text-white' : 'text-black'}`}>
                                {formatIDR(dayBookings.reduce((sum, b) => sum + Number(b.commission_amount || 0), 0))}
                              </div>
                            ) : (
                              <div />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Bookings for Selected Date or Current Month */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-black text-xs flex items-center gap-2">
                        <span>
                          {partnerSelectedDate
                            ? `Bookings for ${safeFormatDate(partnerSelectedDate, { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}`
                            : `All Bookings in ${MONTH_NAMES[partnerCalendarMonth]} ${partnerCalendarYear}`}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/5 text-black font-semibold">
                          {partnerSelectedDate
                            ? (partnerBookingsByDate[partnerSelectedDate]?.length || 0)
                            : partnerMonthBookings.length}
                        </span>
                      </h4>

                      {partnerSelectedDate && (
                        <button
                          onClick={() => setPartnerSelectedDate(null)}
                          className="text-[11px] text-black hover:underline font-semibold"
                        >
                          Show all this month
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                                  <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-black/5 text-black border border-black/10">
                                    {b.status}
                                  </span>
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
                                    <span>Paid</span>
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
                                    <span>Completed</span>
                                  </label>
                                </div>

                                {b.status === 'pending' && (
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => handleUpdateCommission(b.id, { status: 'approved' })}
                                      className="px-2 py-0.5 bg-black hover:bg-black/80 text-white rounded text-[10px] font-bold"
                                    >
                                      Approve
                                    </button>
                                    <button
                                      onClick={() => handleUpdateCommission(b.id, { status: 'declined' })}
                                      className="px-2 py-0.5 border border-black/20 hover:bg-black/5 text-black rounded text-[10px] font-bold"
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
              )}

              {/* TAB C: INDEPENDENT PARTNER COMMISSIONS */}
              {partnerActiveTab === 'commissions' && (
                <div className="space-y-4 text-xs">
                  <div className="flex items-center justify-between bg-black/[0.03] p-3 rounded-xl border border-black/10">
                    <span className="font-bold text-black">Filter Commissions:</span>
                    <div className="flex items-center gap-1">
                      {['all', 'pending', 'approved', 'paid', 'declined'].map((st) => (
                        <button
                          key={st}
                          onClick={() => setPartnerCommFilter(st)}
                          className={`px-2 py-1 rounded-lg capitalize font-medium ${
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
                      <thead className="bg-black text-white font-semibold">
                        <tr>
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Booking Ref</th>
                          <th className="py-2.5 px-3">Treatment Net</th>
                          <th className="py-2.5 px-3">Rate</th>
                          <th className="py-2.5 px-3">Commission</th>
                          <th className="py-2.5 px-3">Verified</th>
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
                                <td className="py-2.5 px-3">{c.commission_rate_pct}%</td>
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
                                    <span>Paid</span>
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
                                    <span>Done</span>
                                  </label>
                                </td>
                                <td className="py-2.5 px-3">
                                  <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-black/5 text-black border border-black/10">
                                    {c.status}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-right space-x-1 whitespace-nowrap">
                                  {c.status === 'pending' && (
                                    <>
                                      <button
                                        onClick={() => handleUpdateCommission(c.id, { status: 'approved' })}
                                        className="px-2 py-1 bg-black hover:bg-black/80 text-white rounded text-[10px] font-semibold"
                                      >
                                        Approve
                                      </button>
                                      <button
                                        onClick={() => handleUpdateCommission(c.id, { status: 'declined' })}
                                        className="px-2 py-1 border border-black/20 hover:bg-black/5 text-black rounded text-[10px] font-semibold"
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
                  <div className="flex items-center justify-between bg-black/[0.03] p-4 rounded-2xl border border-black/10">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-black/50 block">Approved Balance Ready for Payout</span>
                      <span className="text-lg font-bold text-black mt-0.5 block">
                        {formatIDR(activePartnerMetrics.approvedUnpaid)}
                      </span>
                    </div>

                    <button
                      onClick={() => openQuickPayoutForPartner(selectedPartnerDetails)}
                      className="px-4 py-2 bg-black text-white rounded-xl font-bold hover:bg-black/80 shadow-sm"
                    >
                      + Record Payout for {selectedPartnerDetails.first_name}
                    </button>
                  </div>

                  <div className="bg-white rounded-2xl border border-black/10 shadow-xs overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-black text-white font-semibold">
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
                                <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-black/5 text-black border border-black/10">
                                  {py.status}
                                </span>
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
