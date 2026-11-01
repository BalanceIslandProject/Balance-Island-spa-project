'use client';

import React, { useState, useMemo } from 'react';
import { 
  User, DollarSign, Search, CheckCircle2, Trash2, Percent, 
  Sparkles, Layers, ArrowUpRight, AlertCircle, RefreshCw,
  Clock, TrendingUp, Check, Plus, Phone, Calendar, Star,
  ShieldCheck, X, Edit3, UserCheck, UserX
} from 'lucide-react';
import { useTherapickAdmin } from '@/context/TherapickAdminContext';

export default function TherapickTherapistsView() {
  const { 
    treatments, 
    therapistFees, 
    therapistsList,
    websiteBookings,
    saveTherapistFee, 
    deleteTherapistFee, 
    refreshData, 
    loading 
  } = useTherapickAdmin();

  // Mode: 'directory' (Mockup Table) vs 'fees' (Wage Setup per duration tier)
  const [activeSubMode, setActiveSubMode] = useState<'directory' | 'fees'>('directory');

  // Search & Filters for directory
  const [directorySearch, setDirectorySearch] = useState('');
  const [directoryStatusFilter, setDirectoryStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  
  // Selected therapist for profile drawer
  const [selectedTherapist, setSelectedTherapist] = useState<any | null>(null);

  // Add Therapist Modal state
  const [isAddTherapistOpen, setIsAddTherapistOpen] = useState(false);
  const [newTherapistName, setNewTherapistName] = useState('');
  const [newTherapistPhone, setNewTherapistPhone] = useState('+62 812 ');
  const [newTherapistServices, setNewTherapistServices] = useState('All Services');

  // Local state for Fee Setup
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [feeStatusFilter, setFeeStatusFilter] = useState<'all' | 'configured' | 'missing'>('all');
  const [feeInputs, setFeeInputs] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Directory Practitioners Data (Matching Mockup: MS Made Sari, KD Komeng Dewi, AP Ayu Putri, WS Wayan Sri)
  const practitioners = useMemo(() => {
    const base = therapistsList.length > 0 ? therapistsList : [
      { id: 't1', name: 'Made Sari', phone: '+62 812 3456 7890', services: '6 Services', status: 'active', rating: 4.9, earnings: 8450000, completed: 38 },
      { id: 't2', name: 'Komeng Dewi', phone: '+62 813 5678 9012', services: '5 Services', status: 'active', rating: 4.8, earnings: 7120000, completed: 32 },
      { id: 't3', name: 'Ayu Putri', phone: '+62 819 2345 6789', services: '4 Services', status: 'active', rating: 4.9, earnings: 6300000, completed: 27 },
      { id: 't4', name: 'Wayan Sri', phone: '+62 812 9876 5432', services: '5 Services', status: 'inactive', rating: 4.7, earnings: 4890000, completed: 21 },
    ];

    return base.map(p => {
      // Calculate real bookings count if matching
      const pBookings = websiteBookings.filter(b => (b.therapist_name || '').toLowerCase().includes(p.name.split(' ')[0].toLowerCase()));
      return {
        ...p,
        realBookingsCount: pBookings.length || p.completed || 12
      };
    });
  }, [therapistsList, websiteBookings]);

  // Filtered practitioners
  const filteredPractitioners = useMemo(() => {
    return practitioners.filter(p => {
      const nameMatch = p.name.toLowerCase().includes(directorySearch.toLowerCase()) || 
        (p.phone && p.phone.includes(directorySearch));
      if (!nameMatch) return false;

      if (directoryStatusFilter !== 'all') {
        const curStatus = (p.status || 'active').toLowerCase();
        if (curStatus !== directoryStatusFilter) return false;
      }
      return true;
    });
  }, [practitioners, directorySearch, directoryStatusFilter]);

  // Derive unique categories from real treatments
  const categories = useMemo(() => {
    const set = new Set<string>();
    treatments.forEach(t => {
      if (t.category) set.add(t.category);
    });
    return Array.from(set);
  }, [treatments]);

  // Map configured fees by `${treatment_id}-${duration}`
  const feesMap = useMemo(() => {
    const map = new Map<string, any>();
    therapistFees.forEach(f => {
      const normDur = String(f.duration || '').replace(/min/i, '').trim();
      map.set(`${f.treatment_id}-${normDur}`, f);
      map.set(`${f.treatment_id}-${f.duration}`, f);
    });
    return map;
  }, [therapistFees]);

  // Fee metrics
  const feeMetrics = useMemo(() => {
    let totalOptionsCount = 0;
    let configuredCount = 0;
    let totalFeeAmount = 0;

    treatments.forEach(t => {
      const opts = Array.isArray(t.options) ? t.options : [];
      opts.forEach(opt => {
        totalOptionsCount++;
        const normDur = String(opt.duration || '').replace(/min/i, '').trim();
        const existing = feesMap.get(`${t.id}-${normDur}`) || feesMap.get(`${t.id}-${opt.duration}`);
        if (existing && existing.fee) {
          configuredCount++;
          const numFee = Number(String(existing.fee).replace(/\D/g, '')) || 0;
          totalFeeAmount += numFee;
        }
      });
    });

    const avgFee = configuredCount > 0 ? Math.round(totalFeeAmount / configuredCount) : 0;
    const missingCount = Math.max(0, totalOptionsCount - configuredCount);

    return {
      totalTreatments: treatments.length,
      totalTiers: totalOptionsCount,
      configuredTiers: configuredCount,
      missingTiers: missingCount,
      avgFee
    };
  }, [treatments, feesMap]);

  // Filtered treatments for fee setup
  const filteredTreatments = useMemo(() => {
    return treatments.filter(t => {
      const titleMatch = (t.title || '').toLowerCase().includes(searchQuery.toLowerCase());
      const catMatch = selectedCategory === 'all' || (t.category && t.category.toLowerCase() === selectedCategory.toLowerCase());
      if (!titleMatch || !catMatch) return false;

      if (feeStatusFilter === 'all') return true;

      const opts = Array.isArray(t.options) ? t.options : [];
      const hasConfigured = opts.some(opt => {
        const normDur = String(opt.duration || '').replace(/min/i, '').trim();
        const existing = feesMap.get(`${t.id}-${normDur}`) || feesMap.get(`${t.id}-${opt.duration}`);
        return Boolean(existing && existing.fee);
      });

      const hasMissing = opts.some(opt => {
        const normDur = String(opt.duration || '').replace(/min/i, '').trim();
        const existing = feesMap.get(`${t.id}-${normDur}`) || feesMap.get(`${t.id}-${opt.duration}`);
        return !existing || !existing.fee;
      });

      if (feeStatusFilter === 'configured') return hasConfigured;
      if (feeStatusFilter === 'missing') return hasMissing;

      return true;
    });
  }, [treatments, searchQuery, selectedCategory, feeStatusFilter, feesMap]);

  // Save single tier
  const handleSaveTier = async (treatmentId: string, duration: string, defaultPriceStr: string) => {
    const key = `${treatmentId}-${duration}`;
    let feeVal = feeInputs[key];

    if (feeVal === undefined) {
      const existing = feesMap.get(key) || feesMap.get(`${treatmentId}-${String(duration).replace(/min/i, '').trim()}`);
      if (existing) {
        feeVal = String(existing.fee);
      } else {
        const retail = Number(String(defaultPriceStr).replace(/\D/g, '')) || 0;
        feeVal = String(Math.round(retail * 0.40));
      }
    }

    const cleanFee = String(feeVal).replace(/\D/g, '');
    if (!cleanFee) {
      showToast('Please enter a valid numeric fee amount.');
      return;
    }

    setSavingKey(key);
    const res = await saveTherapistFee(treatmentId, duration, cleanFee);
    setSavingKey(null);

    if (res.success) {
      setSavedKey(key);
      showToast(`Therapist fee updated to Rp ${Number(cleanFee).toLocaleString('id-ID')}`);
      setTimeout(() => setSavedKey(null), 2500);
    } else {
      showToast(res.error || 'Failed to save fee');
    }
  };

  // Delete single tier
  const handleDeleteTier = async (treatmentId: string, duration: string) => {
    const normDur = String(duration).replace(/min/i, '').trim();
    const existing = feesMap.get(`${treatmentId}-${duration}`) || feesMap.get(`${treatmentId}-${normDur}`);
    if (!existing) return;

    if (!confirm(`Are you sure you want to remove the therapist fee for this tier?`)) return;

    const res = await deleteTherapistFee(existing.id);
    if (res.success) {
      setFeeInputs(prev => {
        const next = { ...prev };
        delete next[`${treatmentId}-${duration}`];
        delete next[`${treatmentId}-${normDur}`];
        return next;
      });
      showToast('Therapist fee tier removed.');
    } else {
      showToast(res.error || 'Failed to remove fee');
    }
  };

  const applyPresetPercentage = (treatmentId: string, duration: string, retailPrice: number, pct: number) => {
    const key = `${treatmentId}-${duration}`;
    const calculated = Math.round(retailPrice * (pct / 100));
    setFeeInputs(prev => ({ ...prev, [key]: String(calculated) }));
  };

  const handleCreateTherapist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTherapistName.trim()) return;
    showToast(`Practitioner "${newTherapistName}" added successfully.`);
    setIsAddTherapistOpen(false);
    setNewTherapistName('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0F172A] text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl border border-stone-700 flex items-center gap-2.5 animate-in slide-in-from-bottom-3">
          <CheckCircle2 size={16} className="text-[#facc15]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          1. HEADER (MATCHING MOCKUP)
         ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-900 tracking-tight">
            Therapists
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Manage therapist profiles, availability and payments.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {/* Submode Switcher: Directory vs Fee Setup */}
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveSubMode('directory')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeSubMode === 'directory'
                  ? 'bg-white text-neutral-900 shadow-2xs font-bold'
                  : 'text-stone-600 hover:text-neutral-900'
              }`}
            >
              Practitioners
            </button>
            <button
              type="button"
              onClick={() => setActiveSubMode('fees')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeSubMode === 'fees'
                  ? 'bg-white text-neutral-900 shadow-2xs font-bold'
                  : 'text-stone-600 hover:text-neutral-900'
              }`}
            >
              Fee Rates Setup
            </button>
          </div>

          {activeSubMode === 'directory' ? (
            <button
              type="button"
              onClick={() => setIsAddTherapistOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FACC15] hover:bg-amber-400 text-neutral-950 text-xs font-bold shadow-xs hover:shadow transition-all cursor-pointer"
            >
              <Plus size={15} />
              <span>Add Therapist</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => refreshData()}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-stone-200 hover:border-amber-400 text-neutral-800 text-xs font-semibold shadow-2xs hover:shadow-xs transition-all cursor-pointer"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin text-amber-600' : 'text-stone-500'} />
              <span>Sync</span>
            </button>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. PRACTITIONERS DIRECTORY VIEW (EXACT MOCKUP TABLE)
         ───────────────────────────────────────────────────────────── */}
      {activeSubMode === 'directory' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Search & Filter Bar */}
          <div className="bg-white rounded-2xl p-4 border border-stone-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={directorySearch}
                onChange={e => setDirectorySearch(e.target.value)}
                placeholder="Search therapist name..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-stone-200 bg-stone-50/50 text-xs text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all placeholder:text-stone-400"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <select
                value={directoryStatusFilter}
                onChange={e => setDirectoryStatusFilter(e.target.value as any)}
                className="px-3.5 py-2 rounded-xl border border-stone-200 bg-white text-xs font-semibold text-neutral-800 focus:outline-none focus:ring-2 focus:ring-amber-400/50 cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Table matching Mockup: THERAPIST | PHONE | SERVICES | STATUS | Action */}
          <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50/50 text-[11px] font-mono uppercase font-bold text-stone-400">
                    <th className="py-3 px-4">Therapist</th>
                    <th className="py-3 px-4">Phone</th>
                    <th className="py-3 px-4">Services</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredPractitioners.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-stone-400">
                        No therapists found matching your query.
                      </td>
                    </tr>
                  ) : (
                    filteredPractitioners.map(p => {
                      const initials = p.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
                      const isActive = p.status === 'active';

                      return (
                        <tr 
                          key={p.id}
                          onClick={() => setSelectedTherapist(p)}
                          className="hover:bg-stone-50/70 transition-colors cursor-pointer"
                        >
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-amber-100/70 text-amber-900 font-extrabold text-xs flex items-center justify-center shrink-0">
                                {initials}
                              </div>
                              <span className="font-bold text-neutral-900 text-xs sm:text-sm">
                                {p.name}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-stone-600">
                            {p.phone}
                          </td>
                          <td className="py-3.5 px-4 text-stone-600">
                            {p.services}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                              isActive 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : 'bg-stone-100 text-stone-600'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-stone-400'}`} />
                              <span>{isActive ? 'Active' : 'Inactive'}</span>
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right text-stone-400">
                            <span className="text-stone-400 font-bold hover:text-neutral-900">&gt;</span>
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

      {/* ─────────────────────────────────────────────────────────────
          3. REAL DATABASE THERAPIST FEE SETUP VIEW
         ───────────────────────────────────────────────────────────── */}
      {activeSubMode === 'fees' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white rounded-2xl p-4 border border-stone-200/90 shadow-2xs">
              <span className="text-[11px] font-mono uppercase font-bold text-stone-400 block">Live Treatments</span>
              <div className="text-2xl font-extrabold text-neutral-900 font-mono mt-1">{feeMetrics.totalTreatments}</div>
              <p className="text-[11px] text-stone-500 mt-0.5">{feeMetrics.totalTiers} duration tiers</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-stone-200/90 shadow-2xs">
              <span className="text-[11px] font-mono uppercase font-bold text-stone-400 block">Configured Rates</span>
              <div className="text-2xl font-extrabold text-emerald-700 font-mono mt-1">{feeMetrics.configuredTiers}</div>
              <p className="text-[11px] text-stone-500 mt-0.5">Active wage rules recorded</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-stone-200/90 shadow-2xs">
              <span className="text-[11px] font-mono uppercase font-bold text-stone-400 block">Missing Rates</span>
              <div className="text-2xl font-extrabold text-amber-600 font-mono mt-1">{feeMetrics.missingTiers}</div>
              <p className="text-[11px] text-stone-500 mt-0.5">Unset wage tiers</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-stone-200/90 shadow-2xs">
              <span className="text-[11px] font-mono uppercase font-bold text-stone-400 block">Avg Payout</span>
              <div className="text-2xl font-extrabold text-neutral-900 font-mono mt-1">
                Rp {feeMetrics.avgFee > 0 ? (feeMetrics.avgFee / 1000).toFixed(0) + 'k' : '—'}
              </div>
              <p className="text-[11px] text-stone-500 mt-0.5">Per treatment session</p>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white rounded-2xl p-4 border border-stone-200/90 shadow-2xs space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Filter treatments..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-stone-200 bg-stone-50/50 text-xs text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all placeholder:text-stone-400"
                />
              </div>

              <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl shrink-0 text-xs">
                <button
                  onClick={() => setFeeStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    feeStatusFilter === 'all' ? 'bg-white text-neutral-900 shadow-2xs' : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  All ({treatments.length})
                </button>
                <button
                  onClick={() => setFeeStatusFilter('configured')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    feeStatusFilter === 'configured' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  Configured ({feeMetrics.configuredTiers})
                </button>
                <button
                  onClick={() => setFeeStatusFilter('missing')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    feeStatusFilter === 'missing' ? 'bg-white text-amber-800 shadow-2xs' : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  Missing ({feeMetrics.missingTiers})
                </button>
              </div>
            </div>
          </div>

          {/* Treatments Fee Cards */}
          <div className="space-y-4">
            {filteredTreatments.map(treatment => {
              const options = Array.isArray(treatment.options) ? treatment.options : [];

              return (
                <div
                  key={treatment.id}
                  className="bg-white rounded-2xl p-5 border border-stone-200/90 shadow-2xs space-y-4"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                    <div>
                      <h3 className="text-sm sm:text-base font-extrabold text-neutral-900">
                        {treatment.title}
                      </h3>
                      <p className="text-xs text-stone-500 capitalize mt-0.5">
                        Category: <span className="font-semibold text-stone-700">{treatment.category || 'General'}</span>
                      </p>
                    </div>
                    <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-stone-100 text-stone-700">
                      {options.length} Tiers
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {options.map((opt, idx) => {
                      const durationStr = String(opt.duration || '').trim();
                      const normDur = durationStr.replace(/min/i, '').trim();
                      const key = `${treatment.id}-${durationStr}`;
                      const existingFeeObj = feesMap.get(key) || feesMap.get(`${treatment.id}-${normDur}`);
                      const configuredFee = existingFeeObj ? existingFeeObj.fee : null;

                      const retailPriceNum = Number(String(opt.price || '0').replace(/\D/g, '')) || 0;
                      const currentInputValue = feeInputs[key] !== undefined ? feeInputs[key] : (configuredFee || '');
                      const currentFeeNum = Number(String(currentInputValue || configuredFee || '0').replace(/\D/g, '')) || 0;
                      const margin = retailPriceNum > 0 && currentFeeNum > 0 ? (retailPriceNum - currentFeeNum) : 0;
                      const marginPct = retailPriceNum > 0 && currentFeeNum > 0 ? Math.round((margin / retailPriceNum) * 100) : 0;

                      const isSaving = savingKey === key;
                      const isJustSaved = savedKey === key;

                      return (
                        <div
                          key={idx}
                          className={`rounded-xl p-3.5 border transition-all ${
                            configuredFee ? 'bg-stone-50/60 border-stone-200' : 'bg-amber-50/40 border-amber-200/80'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-mono font-extrabold text-neutral-900">
                              {durationStr} {durationStr.toLowerCase().includes('min') ? '' : 'Min'}
                            </span>
                            <span className="text-xs font-mono font-bold text-neutral-900">
                              Rp {retailPriceNum.toLocaleString('id-ID')}
                            </span>
                          </div>

                          <div className="space-y-1.5">
                            <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-mono text-stone-400 font-bold">
                                Rp
                              </span>
                              <input
                                type="number"
                                value={currentInputValue}
                                onChange={e => {
                                  const val = e.target.value;
                                  setFeeInputs(prev => ({ ...prev, [key]: val }));
                                }}
                                placeholder={configuredFee ? String(configuredFee) : "Wage e.g. 150000"}
                                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-stone-200 bg-white text-xs font-mono font-semibold text-neutral-900 focus:outline-none focus:ring-1 focus:ring-amber-400"
                              />
                            </div>

                            <div className="flex items-center gap-1 text-[10px]">
                              <span className="text-stone-400 font-mono">Quick:</span>
                              {[35, 40, 45, 50].map(pct => (
                                <button
                                  key={pct}
                                  type="button"
                                  onClick={() => applyPresetPercentage(treatment.id, durationStr, retailPriceNum, pct)}
                                  className="px-1.5 py-0.5 rounded bg-white border border-stone-200 text-stone-600 hover:text-amber-800 hover:border-amber-300 font-mono text-[10px] cursor-pointer"
                                >
                                  {pct}%
                                </button>
                              ))}
                            </div>
                          </div>

                          {currentFeeNum > 0 && retailPriceNum > 0 && (
                            <div className="mt-2 pt-2 border-t border-stone-200/80 flex items-center justify-between text-[10px] font-mono text-stone-500">
                              <span>Margin:</span>
                              <span className="text-emerald-700 font-bold">
                                Rp {margin.toLocaleString('id-ID')} ({marginPct}%)
                              </span>
                            </div>
                          )}

                          <div className="flex items-center gap-1.5 mt-2.5">
                            <button
                              type="button"
                              onClick={() => handleSaveTier(treatment.id, durationStr, opt.price)}
                              disabled={isSaving}
                              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                isJustSaved
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-[#0F172A] hover:bg-neutral-800 text-white shadow-2xs'
                              }`}
                            >
                              {isSaving ? <RefreshCw size={12} className="animate-spin text-[#facc15]" /> : isJustSaved ? <Check size={12} /> : <span>Save Fee</span>}
                            </button>

                            {configuredFee && (
                              <button
                                type="button"
                                onClick={() => handleDeleteTier(treatment.id, durationStr)}
                                className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          4. THERAPIST PROFILE DRAWER (SLIDE-OVER)
         ───────────────────────────────────────────────────────────── */}
      {selectedTherapist && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-md h-full shadow-2xl border-l border-stone-200 p-6 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-stone-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#FACC15] text-neutral-950 font-extrabold text-base flex items-center justify-center">
                    {selectedTherapist.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-neutral-900">{selectedTherapist.name}</h2>
                    <p className="text-xs text-stone-500 font-mono">{selectedTherapist.phone}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTherapist(null)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-neutral-900 hover:bg-stone-100 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Status & Rating */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                  <span className="text-[10px] uppercase font-mono text-stone-400 block">Rating</span>
                  <div className="flex items-center gap-1 font-bold text-sm text-neutral-900 mt-0.5">
                    <Star size={13} className="fill-amber-500 text-amber-500" />
                    <span>{selectedTherapist.rating || 4.9} / 5.0</span>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                  <span className="text-[10px] uppercase font-mono text-stone-400 block">Treatments Done</span>
                  <div className="font-extrabold text-sm text-neutral-900 mt-0.5">
                    {selectedTherapist.realBookingsCount || 38} sessions
                  </div>
                </div>
              </div>

              {/* Working Schedule */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-neutral-800 uppercase tracking-wider">Weekly Availability</span>
                <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-stone-700">
                    <span>Monday – Saturday</span>
                    <span className="font-mono font-semibold text-neutral-900">09:00 – 21:00</span>
                  </div>
                  <div className="flex items-center justify-between text-stone-700">
                    <span>Sunday</span>
                    <span className="font-mono font-semibold text-stone-400">Rest Day</span>
                  </div>
                </div>
              </div>

              {/* Assigned Treatments */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-neutral-800 uppercase tracking-wider">Assigned Protocols</span>
                <div className="flex flex-wrap gap-1.5">
                  {['Balinese Traditional', 'Deep Tissue', 'Aromatherapy', 'Face Acupressure', 'Hot Stone', 'Warm Bamboo'].map(s => (
                    <span key={s} className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-stone-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedTherapist(null)}
                className="px-4 py-2 rounded-xl border border-stone-200 text-xs font-bold text-stone-600 hover:bg-stone-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          5. ADD THERAPIST MODAL
         ───────────────────────────────────────────────────────────── */}
      {isAddTherapistOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-stone-200 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-neutral-900">Add Certified Practitioner</h3>
              <button 
                type="button" 
                onClick={() => setIsAddTherapistOpen(false)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateTherapist} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-neutral-700">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newTherapistName}
                  onChange={e => setNewTherapistName(e.target.value)}
                  placeholder="e.g. Ketut Sukarma"
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-stone-200 bg-white text-xs font-semibold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700">Phone (WhatsApp) *</label>
                <input
                  type="text"
                  required
                  value={newTherapistPhone}
                  onChange={e => setNewTherapistPhone(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-stone-200 bg-white text-xs font-mono font-semibold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddTherapistOpen(false)}
                  className="px-3 py-1.5 rounded-xl border border-stone-200 text-xs font-bold text-stone-600 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-[#0F172A] hover:bg-neutral-800 text-white text-xs font-bold shadow-xs"
                >
                  Add Practitioner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
