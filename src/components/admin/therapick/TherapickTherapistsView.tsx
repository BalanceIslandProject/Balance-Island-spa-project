'use client';

import React, { useState, useMemo } from 'react';
import { 
  DollarSign, Search, CheckCircle2, Trash2, Percent, 
  Sparkles, Layers, ArrowUpRight, AlertCircle, RefreshCw,
  Clock, TrendingUp, Check, Plus, Edit3, X
} from 'lucide-react';
import { useTherapickAdmin } from '@/context/TherapickAdminContext';

export default function TherapickTherapistsView() {
  const { 
    treatments, 
    therapistFees, 
    saveTherapistFee, 
    deleteTherapistFee, 
    refreshData, 
    loading 
  } = useTherapickAdmin();

  // Search & Category Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [feeStatusFilter, setFeeStatusFilter] = useState<'all' | 'configured' | 'missing'>('all');
  
  // Inline editing state: editingFee is { id: treatmentId, duration: optDuration }
  const [editingFee, setEditingFee] = useState<{ id: string; duration: string } | null>(null);
  const [feeInputs, setFeeInputs] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

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

  // Metrics
  const metrics = useMemo(() => {
    let totalTiers = 0;
    let configuredCount = 0;

    treatments.forEach(t => {
      const options = Array.isArray(t.options) ? t.options : [];
      totalTiers += options.length;
      options.forEach(opt => {
        const normDur = String(opt.duration || '').replace(/min/i, '').trim();
        if (feesMap.has(`${t.id}-${normDur}`) || feesMap.has(`${t.id}-${opt.duration}`)) {
          configuredCount++;
        }
      });
    });

    return {
      totalTreatments: treatments.length,
      totalTiers,
      configuredCount,
      missingCount: Math.max(0, totalTiers - configuredCount)
    };
  }, [treatments, feesMap]);

  // Filtered treatments
  const filteredTreatments = useMemo(() => {
    return treatments.filter(t => {
      const titleMatch = (t.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.desc || '').toLowerCase().includes(searchQuery.toLowerCase());
      const catMatch = selectedCategory === 'all' || (t.category && t.category.toLowerCase() === selectedCategory.toLowerCase());

      if (!titleMatch || !catMatch) return false;

      if (feeStatusFilter !== 'all') {
        const options = Array.isArray(t.options) ? t.options : [];
        const hasAllConfigured = options.every(opt => {
          const normDur = String(opt.duration || '').replace(/min/i, '').trim();
          return feesMap.has(`${t.id}-${normDur}`) || feesMap.has(`${t.id}-${opt.duration}`);
        });

        if (feeStatusFilter === 'configured' && !hasAllConfigured) return false;
        if (feeStatusFilter === 'missing' && hasAllConfigured) return false;
      }

      return true;
    });
  }, [treatments, searchQuery, selectedCategory, feeStatusFilter, feesMap]);

  // Save single tier wage
  const handleSaveFee = async (treatmentId: string, duration: string) => {
    const key = `${treatmentId}-${duration}`;
    const rawVal = feeInputs[key];
    const cleanFee = String(rawVal || '').replace(/\D/g, '').trim();

    if (!cleanFee) {
      showToast('Please enter a valid wage fee in IDR.');
      return;
    }

    setSavingKey(key);
    try {
      const res = await saveTherapistFee(treatmentId, duration, cleanFee);
      if (res.success) {
        showToast(`Therapist fee updated to Rp ${Number(cleanFee).toLocaleString('id-ID')}`);
        setEditingFee(null);
        await refreshData();
      } else {
        showToast(`Failed to update fee: ${res.error}`);
      }
    } finally {
      setSavingKey(null);
    }
  };

  // Delete / Clear single tier wage
  const handleDeleteFee = async (feeId: string, treatmentTitle: string) => {
    if (!confirm(`Are you sure you want to remove the therapist fee configuration for ${treatmentTitle}?`)) {
      return;
    }

    const res = await deleteTherapistFee(feeId);
    if (res.success) {
      showToast('Therapist fee rule removed.');
      await refreshData();
    } else {
      showToast(`Failed: ${res.error}`);
    }
  };

  // Quick preset calculation
  const applyPresetPercentage = (treatmentId: string, duration: string, retailPrice: number, pct: number) => {
    const calculatedFee = Math.round((retailPrice * pct) / 100);
    const key = `${treatmentId}-${duration}`;
    setFeeInputs(prev => ({
      ...prev,
      [key]: String(calculatedFee)
    }));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0F172A] text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-bottom border-l-4 border-[#facc15]">
          <CheckCircle2 size={16} className="text-[#facc15] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          1. PAGE HEADER (CENTRAL ADMIN STYLE WITH THERAPICK ACCENT)
         ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-900 tracking-tight">
              Therapist Fee Setup
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#facc15] text-neutral-950">
              Therapick Website
            </span>
          </div>
          <p className="text-xs sm:text-sm text-stone-500">
            Configure therapist payout wages per treatment duration tier for direct website bookings.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => refreshData()}
            className="px-3 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-700 flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin text-amber-500' : 'text-stone-400'} />
            <span>Sync Live DB</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. METRICS STRIP (CENTRAL ADMIN DIVIDED CARD STYLE)
         ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 border border-stone-200/90 rounded-2xl divide-y sm:divide-y-0 sm:divide-x divide-stone-200 bg-white overflow-hidden shadow-2xs">
        <div className="p-4 sm:p-5">
          <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-stone-500">
            Total Treatments
          </div>
          <div className="text-2xl font-extrabold text-neutral-900 mt-1 font-mono">
            {metrics.totalTreatments}
          </div>
          <div className="text-xs text-stone-400 mt-0.5">Live catalog in database</div>
        </div>

        <div className="p-4 sm:p-5">
          <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-700">
            Configured Wage Tiers
          </div>
          <div className="text-2xl font-extrabold text-emerald-700 mt-1 font-mono">
            {metrics.configuredCount} / {metrics.totalTiers}
          </div>
          <div className="text-xs text-stone-400 mt-0.5">Active therapist payouts</div>
        </div>

        <div className="p-4 sm:p-5">
          <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-700">
            Pending Wage Setup
          </div>
          <div className="text-2xl font-extrabold text-amber-700 mt-1 font-mono">
            {metrics.missingCount}
          </div>
          <div className="text-xs text-stone-400 mt-0.5">Tiers requiring fee rule</div>
        </div>

        <div className="p-4 sm:p-5">
          <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-stone-500">
            Active Brand Scope
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-neutral-900 mt-1 flex items-center gap-1.5 font-mono">
            <span className="w-2.5 h-2.5 rounded-full bg-[#facc15]" />
            <span>Therapick</span>
          </div>
          <div className="text-xs text-stone-400 mt-0.5">Direct website reservations</div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. SEARCH & FILTERS
         ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200/90 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3.5 top-3 text-stone-400" />
          <input
            type="text"
            placeholder="Search treatment title or keywords..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full text-xs bg-stone-50/70 border border-stone-200 rounded-xl pl-9 pr-3 py-2.5 text-neutral-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="text-xs bg-stone-50/70 border border-stone-200 rounded-xl px-3 py-2.5 text-neutral-900 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            <option value="all">All Categories ({treatments.length})</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat} ({treatments.filter(t => t.category === cat).length})
              </option>
            ))}
          </select>

          {/* Configured status pills */}
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl">
            {(['all', 'configured', 'missing'] as const).map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => setFeeStatusFilter(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                  feeStatusFilter === tab
                    ? 'bg-white text-neutral-900 shadow-xs'
                    : 'text-stone-600 hover:text-neutral-900'
                }`}
              >
                {tab === 'missing' ? 'Pending' : tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. TREATMENT FEE CARDS GRID (CENTRAL ADMIN STYLE)
         ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTreatments.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl border border-stone-200 p-12 text-center text-stone-400">
            <DollarSign size={32} className="mx-auto mb-2 text-stone-300" />
            <p className="font-semibold text-stone-600">No treatments found</p>
            <p className="text-xs text-stone-400 mt-1">Try refining your search query or category filter.</p>
          </div>
        ) : (
          filteredTreatments.map(t => {
            const options = Array.isArray(t.options) ? t.options : [];

            return (
              <div 
                key={t.id} 
                className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-2xs hover:border-amber-400/80 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <div>
                      <h4 className="font-bold text-neutral-900 text-sm leading-snug">
                        {t.title}
                      </h4>
                      <p className="text-[11px] text-stone-400 line-clamp-1 mt-0.5">
                        {t.desc || 'Signature in-villa therapeutic treatment.'}
                      </p>
                    </div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-50 text-amber-900 border border-amber-200/80 capitalize shrink-0">
                      {t.category || 'Treatment'}
                    </span>
                  </div>
                </div>

                {/* Duration & Fee Table */}
                <div className="space-y-4 pt-3 border-t border-stone-100">
                  <div className="border border-stone-200 rounded-xl overflow-hidden bg-white">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-stone-50 border-b border-stone-200 text-[10px] font-mono uppercase font-bold text-stone-500">
                        <tr>
                          <th className="py-2.5 px-3">Duration</th>
                          <th className="py-2.5 px-2 text-right">Price</th>
                          <th className="py-2.5 px-2 text-right">Therapist Fee</th>
                          <th className="py-2.5 px-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {options.map((opt, idx) => {
                          const durationStr = String(opt.duration || '').trim();
                          const normDur = durationStr.replace(/min/i, '').trim();
                          const key = `${t.id}-${durationStr}`;
                          
                          const feeObj = feesMap.get(key) || feesMap.get(`${t.id}-${normDur}`);
                          const configuredFee = feeObj ? feeObj.fee : null;
                          const retailPriceNum = Number(String(opt.price || '0').replace(/\D/g, '')) || 0;
                          
                          const isEditing = editingFee?.id === t.id && editingFee?.duration === durationStr;
                          const inputValue = feeInputs[key] !== undefined ? feeInputs[key] : (configuredFee || '');
                          const currentFeeNum = Number(String(inputValue || configuredFee || '0').replace(/\D/g, '')) || 0;
                          
                          const margin = retailPriceNum > 0 && currentFeeNum > 0 ? (retailPriceNum - currentFeeNum) : 0;
                          const marginPct = retailPriceNum > 0 && currentFeeNum > 0 ? Math.round((margin / retailPriceNum) * 100) : 0;
                          const isSaving = savingKey === key;

                          return (
                            <tr key={idx} className="hover:bg-amber-50/20 transition-colors">
                              {/* Duration */}
                              <td className="py-2.5 px-3 font-mono font-semibold text-neutral-900">
                                {durationStr} {durationStr.toLowerCase().includes('min') ? '' : 'm'}
                              </td>

                              {/* Retail Price */}
                              <td className="py-2.5 px-2 text-right font-mono text-stone-500 text-[11px]">
                                Rp {retailPriceNum.toLocaleString('id-ID')}
                              </td>

                              {/* Therapist Fee (Wage) */}
                              <td className="py-2.5 px-2 text-right font-mono font-bold">
                                {isEditing ? (
                                  <div className="inline-flex items-center gap-1 justify-end">
                                    <span className="text-[10px] text-stone-400">Rp</span>
                                    <input
                                      type="number"
                                      autoFocus
                                      placeholder="e.g. 150000"
                                      value={inputValue}
                                      onChange={e => {
                                        const val = e.target.value;
                                        setFeeInputs(prev => ({ ...prev, [key]: val }));
                                      }}
                                      className="w-24 text-right py-0.5 px-1.5 text-xs font-mono font-bold border border-amber-400 rounded bg-white focus:outline-none"
                                    />
                                  </div>
                                ) : (
                                  <span className={configuredFee ? 'text-emerald-700' : 'text-stone-400 italic font-normal'}>
                                    {configuredFee ? `Rp ${Number(configuredFee).toLocaleString('id-ID')}` : 'Not set'}
                                  </span>
                                )}
                              </td>

                              {/* Action */}
                              <td className="py-2.5 px-3 text-right">
                                {isEditing ? (
                                  <div className="flex items-center justify-end gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleSaveFee(t.id, durationStr)}
                                      disabled={isSaving}
                                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#facc15] hover:bg-[#eab308] text-neutral-950 transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                                    >
                                      {isSaving ? <RefreshCw size={10} className="animate-spin" /> : <Check size={10} />}
                                      <span>Save</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingFee(null)}
                                      className="px-1.5 py-0.5 rounded text-[10px] text-stone-500 hover:bg-stone-100 transition-colors cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-end gap-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setFeeInputs(prev => ({ ...prev, [key]: configuredFee || '' }));
                                        setEditingFee({ id: t.id, duration: durationStr });
                                      }}
                                      className="p-1 text-stone-400 hover:text-neutral-900 rounded hover:bg-stone-100 transition-colors cursor-pointer"
                                      title="Edit Fee"
                                    >
                                      <Edit3 size={12} />
                                    </button>
                                    {feeObj && (
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteFee(feeObj.id, t.title)}
                                        className="p-1 text-stone-300 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                                        title="Delete Fee"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    )}
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Quick percentage helper when editing */}
                  {editingFee?.id === t.id && (
                    <div className="p-2 rounded-xl bg-amber-50/70 border border-amber-200/60 flex items-center justify-between text-[11px]">
                      <span className="text-amber-900 font-bold font-mono">Quick Pct:</span>
                      <div className="flex items-center gap-1">
                        {[35, 40, 45, 50].map(pct => {
                          const optObj = options.find(o => String(o.duration || '').trim() === editingFee.duration);
                          const priceNum = Number(String(optObj?.price || '0').replace(/\D/g, '')) || 0;
                          return (
                            <button
                              key={pct}
                              type="button"
                              onClick={() => applyPresetPercentage(t.id, editingFee.duration, priceNum, pct)}
                              className="px-1.5 py-0.5 rounded bg-white text-neutral-900 font-mono font-bold text-[10px] border border-amber-200 hover:bg-[#facc15] transition-colors cursor-pointer shadow-2xs"
                            >
                              {pct}%
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
