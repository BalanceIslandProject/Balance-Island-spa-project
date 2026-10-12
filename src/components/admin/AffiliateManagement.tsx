'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Coins, 
  CreditCard, 
  Settings, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Clock, 
  Search, 
  Filter, 
  Plus, 
  RefreshCw,
  ExternalLink,
  Edit2,
  Check,
  Send
} from 'lucide-react';

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
  const [searchQuery, setSearchQuery] = useState('');

  // Payout Modal State
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutForm, setPayoutForm] = useState({
    partner_id: '',
    amount: '',
    payout_method: 'bank_transfer',
    notes: '',
  });

  // Commission rate edit state
  const [editingRateId, setEditingRateId] = useState<string | null>(null);
  const [newRateValue, setNewRateValue] = useState<number>(15);

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
        fetch(`/api/affiliates/admin/commissions?status=${commissionStatusFilter}`),
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
  }, [partnerStatusFilter, commissionStatusFilter]);

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
        setEditingRateId(null);
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
        alert('Settings updated successfully!');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
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

  return (
    <div className="space-y-6">
      
      {/* Header & Sub-Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/10 pb-4">
        <div>
          <h1 className="text-xl font-bold text-black flex items-center gap-2">
            <span>BookTherapick Affiliate & Partner Management</span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-semibold">
              Therapick Domain
            </span>
          </h1>
          <p className="text-xs text-black/60 mt-0.5">
            Manage approved referral partners, review commissions, and record payouts
          </p>
        </div>

        <div className="flex items-center gap-1 bg-black/5 p-1 rounded-xl">
          {[
            { id: 'partners', label: 'Partners', icon: Users, count: partners.length },
            { id: 'commissions', label: 'Commissions', icon: Coins, count: commissions.length },
            { id: 'payouts', label: 'Payouts', icon: CreditCard, count: payouts.length },
            { id: 'settings', label: 'Settings', icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = subTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSubTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-black text-white shadow-sm'
                    : 'text-black/70 hover:text-black hover:bg-black/5'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-white/20' : 'bg-black/10'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* SUB-TAB 1: PARTNERS */}
      {subTab === 'partners' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-black/10 shadow-sm">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-black/40 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search partner by code, name, email, or villa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-black/10 focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div className="flex items-center gap-1 text-xs">
              {['all', 'pending', 'active', 'suspended', 'rejected'].map((st) => (
                <button
                  key={st}
                  onClick={() => setPartnerStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg capitalize font-medium ${
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
                <thead className="bg-[#FAF7F2] border-b border-black/10 text-black/60 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Partner Code</th>
                    <th className="py-3 px-4">Name / Villa</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Commission %</th>
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
                    filteredPartners.map((p) => (
                      <tr key={p.id} className="hover:bg-black/[0.02]">
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            {p.partner_code}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-black">{p.first_name} {p.last_name}</div>
                          {p.business_name && (
                            <div className="text-[11px] text-black/60">{p.business_name}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-black/70">
                          <div>{p.email}</div>
                          {p.whatsapp && (
                            <div className="text-[11px] text-emerald-700">WA: {p.whatsapp}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 capitalize text-black/70">
                          {p.partner_type?.replace('_', ' ')}
                        </td>
                        <td className="py-3 px-4">
                          {editingRateId === p.id ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min={1}
                                max={100}
                                value={newRateValue}
                                onChange={(e) => setNewRateValue(Number(e.target.value))}
                                className="w-14 px-1.5 py-0.5 border border-black/20 rounded text-xs"
                              />
                              <button
                                onClick={() => handleSaveCommissionRate(p.id)}
                                className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                              >
                                <Check size={12} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingRateId(p.id);
                                setNewRateValue(p.commission_rate_pct);
                              }}
                              className="font-bold text-black flex items-center gap-1 hover:text-amber-800"
                            >
                              <span>{p.commission_rate_pct}%</span>
                              <Edit2 size={10} className="opacity-40" />
                            </button>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                              p.status === 'active'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : p.status === 'pending'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-red-50 text-red-700 border border-red-200'
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-1">
                          {p.status === 'pending' && (
                            <button
                              onClick={() => handlePartnerStatus(p.id, 'active')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px]"
                            >
                              Approve
                            </button>
                          )}
                          {p.status === 'active' && (
                            <button
                              onClick={() => handlePartnerStatus(p.id, 'suspended')}
                              className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg text-[11px]"
                            >
                              Suspend
                            </button>
                          )}
                          {p.status === 'suspended' && (
                            <button
                              onClick={() => handlePartnerStatus(p.id, 'active')}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-[11px]"
                            >
                              Reactivate
                            </button>
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

      {/* SUB-TAB 2: COMMISSIONS */}
      {subTab === 'commissions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-black/10 shadow-sm text-xs">
            <span className="font-bold text-black">Filter Commission Status:</span>
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

          <div className="bg-white rounded-2xl border border-black/10 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF7F2] border-b border-black/10 text-black/60 font-semibold">
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
                  {commissions.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-black/50">
                        No commissions found under this filter.
                      </td>
                    </tr>
                  ) : (
                    commissions.map((c) => (
                      <tr key={c.id} className="hover:bg-black/[0.02]">
                        <td className="py-3 px-4 text-black/60">
                          {new Date(c.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-black">
                          #{c.booking_id}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono text-amber-900 font-semibold">{c.partner_code}</span>
                        </td>
                        <td className="py-3 px-4 text-black/60">
                          {formatIDR(c.booking_amount_gross)}
                        </td>
                        <td className="py-3 px-4 font-medium text-black">
                          {formatIDR(c.eligible_treatment_amount)}
                        </td>
                        <td className="py-3 px-4 text-black/60">{c.commission_rate_pct}%</td>
                        <td className="py-3 px-4 font-bold text-amber-900">
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
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                              c.status === 'paid'
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : c.status === 'approved'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : c.status === 'declined'
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {c.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-1">
                          {c.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleUpdateCommission(c.id, { status: 'approved' })}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleUpdateCommission(c.id, { status: 'declined' })}
                                className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[11px] font-semibold"
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

      {/* SUB-TAB 3: PAYOUTS */}
      {subTab === 'payouts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-black/10 shadow-sm">
            <div>
              <h3 className="font-bold text-black text-sm">Partner Commission Payouts</h3>
              <p className="text-xs text-black/60">Record transfers to close out approved partner earnings</p>
            </div>
            <button
              onClick={() => setShowPayoutModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-black text-white rounded-xl text-xs font-bold hover:bg-black/80 shadow-sm"
            >
              <Plus size={14} /> Record New Payout
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-black/10 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF7F2] border-b border-black/10 text-black/60 font-semibold">
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
                  {payouts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-black/50">
                        No payout records logged yet.
                      </td>
                    </tr>
                  ) : (
                    payouts.map((py) => (
                      <tr key={py.id} className="hover:bg-black/[0.02]">
                        <td className="py-3 px-4 text-black/60">
                          {new Date(py.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-black">{py.payout_reference}</td>
                        <td className="py-3 px-4">
                          <span className="font-mono text-amber-900 font-semibold">{py.partner_code}</span>
                        </td>
                        <td className="py-3 px-4 font-bold text-amber-900">{formatIDR(py.amount)}</td>
                        <td className="py-3 px-4 capitalize">{py.payout_method?.replace('_', ' ')}</td>
                        <td className="py-3 px-4">
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 capitalize">
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
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleRecordPayout}
            className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-black/10 shadow-2xl"
          >
            <h3 className="font-bold text-black text-sm">Record Partner Payout</h3>

            <div>
              <label className="block text-xs font-semibold text-black mb-1">Select Partner *</label>
              <select
                required
                value={payoutForm.partner_id}
                onChange={(e) => setPayoutForm({ ...payoutForm, partner_id: e.target.value })}
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
                <option value="bank_transfer">Indonesian Bank Transfer (BCA/Mandiri/etc)</option>
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
          </form>
        </div>
      )}

    </div>
  );
}
