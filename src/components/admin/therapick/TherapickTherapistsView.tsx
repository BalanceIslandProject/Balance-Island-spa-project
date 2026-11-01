'use client';

import React, { useState, useMemo } from 'react';
import { 
  DollarSign, Search, CheckCircle2, Trash2, Percent, 
  Sparkles, Layers, ArrowUpRight, AlertCircle, RefreshCw,
  Clock, TrendingUp, Check
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

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'configured' | 'missing'>('all');
  
  // Local edit inputs state: key is `${treatmentId}-${duration}`
  const [feeInputs, setFeeInputs] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [savedKey, setSavedKey] = useState<string | null>(null);
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
      // Normalize duration: strip "min", trim, uppercase
      const normDur = String(f.duration || '').replace(/min/i, '').trim();
      const key = `${f.treatment_id}-${normDur}`;
      map.set(key, f);
      // Also set raw key
      map.set(`${f.treatment_id}-${f.duration}`, f);
    });
    return map;
  }, [therapistFees]);

  // Calculate high-level summary metrics
  const metrics = useMemo(() => {
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

  // Filtered treatments list
  const filteredTreatments = useMemo(() => {
    return treatments.filter(t => {
      const titleMatch = (t.title || '').toLowerCase().includes(searchQuery.toLowerCase());
      const catMatch = selectedCategory === 'all' || (t.category && t.category.toLowerCase() === selectedCategory.toLowerCase());
      
      if (!titleMatch || !catMatch) return false;

      if (statusFilter === 'all') return true;

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

      if (statusFilter === 'configured') return hasConfigured;
      if (statusFilter === 'missing') return hasMissing;

      return true;
    });
  }, [treatments, searchQuery, selectedCategory, statusFilter, feesMap]);

  // Handle saving a single fee tier
  const handleSaveTier = async (treatmentId: string, duration: string, defaultPriceStr: string) => {
    const key = `${treatmentId}-${duration}`;
    let feeVal = feeInputs[key];

    if (feeVal === undefined) {
      // Check if existing fee exists
      const existing = feesMap.get(key) || feesMap.get(`${treatmentId}-${String(duration).replace(/min/i, '').trim()}`);
      if (existing) {
        feeVal = String(existing.fee);
      } else {
        // Fallback default 40% of retail price
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

  // Handle deleting a single fee tier
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

  // Preset percentage helper
  const applyPresetPercentage = (treatmentId: string, duration: string, retailPrice: number, pct: number) => {
    const key = `${treatmentId}-${duration}`;
    const calculated = Math.round(retailPrice * (pct / 100));
    setFeeInputs(prev => ({ ...prev, [key]: String(calculated) }));
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

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-amber-700 font-bold bg-amber-100/70 px-2 py-0.5 rounded">
              Website System
            </span>
            <span className="text-[11px] text-stone-400 font-mono">Live Database</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-900 tracking-tight mt-1 flex items-center gap-2">
            <DollarSign className="text-amber-500" size={24} />
            Therapist Fee Setup
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Set and manage practitioner compensation wages per duration tier across all live Therapick treatments.
          </p>
        </div>

        <button
          onClick={() => refreshData()}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-stone-200 hover:border-amber-400 text-neutral-800 text-xs font-semibold shadow-2xs hover:shadow-xs transition-all cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin text-amber-600' : 'text-stone-500'} />
          <span>Sync Database</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl p-4 border border-stone-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-stone-400 mb-1.5">
            <span className="text-[11px] font-mono uppercase font-bold tracking-wider">Live Treatments</span>
            <Layers size={14} className="text-stone-400" />
          </div>
          <div className="text-2xl font-extrabold text-neutral-900 font-mono">
            {metrics.totalTreatments}
          </div>
          <p className="text-[11px] text-stone-500 mt-1">
            {metrics.totalTiers} total duration tiers
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-stone-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-stone-400 mb-1.5">
            <span className="text-[11px] font-mono uppercase font-bold tracking-wider">Configured Rates</span>
            <CheckCircle2 size={14} className="text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-700 font-mono">
            {metrics.configuredTiers} <span className="text-xs font-normal text-stone-400 font-sans">/ {metrics.totalTiers}</span>
          </div>
          <p className="text-[11px] text-stone-500 mt-1">
            Active wage rates recorded
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-stone-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-stone-400 mb-1.5">
            <span className="text-[11px] font-mono uppercase font-bold tracking-wider">Missing Rates</span>
            <AlertCircle size={14} className={metrics.missingTiers > 0 ? 'text-amber-500' : 'text-stone-400'} />
          </div>
          <div className={`text-2xl font-extrabold font-mono ${metrics.missingTiers > 0 ? 'text-amber-600' : 'text-stone-700'}`}>
            {metrics.missingTiers}
          </div>
          <p className="text-[11px] text-stone-500 mt-1">
            {metrics.missingTiers === 0 ? 'All tiers fully covered' : 'Requires fee configuration'}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-stone-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-stone-400 mb-1.5">
            <span className="text-[11px] font-mono uppercase font-bold tracking-wider">Avg Therapist Wage</span>
            <TrendingUp size={14} className="text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-neutral-900 font-mono">
            Rp {metrics.avgFee > 0 ? (metrics.avgFee / 1000).toFixed(0) + 'k' : '—'}
          </div>
          <p className="text-[11px] text-stone-500 mt-1">
            Average practitioner payout
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200/90 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search treatments by title or keyword..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-stone-200 bg-stone-50/50 text-xs text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all placeholder:text-stone-400"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl shrink-0 text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                statusFilter === 'all' ? 'bg-white text-neutral-900 shadow-2xs' : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              All Tiers
            </button>
            <button
              onClick={() => setStatusFilter('configured')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                statusFilter === 'configured' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              Configured ({metrics.configuredTiers})
            </button>
            <button
              onClick={() => setStatusFilter('missing')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                statusFilter === 'missing' ? 'bg-white text-amber-800 shadow-2xs' : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              Missing ({metrics.missingTiers})
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all shrink-0 cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-neutral-900 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            All Categories ({treatments.length})
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all shrink-0 capitalize cursor-pointer ${
                selectedCategory.toLowerCase() === cat.toLowerCase()
                  ? 'bg-neutral-900 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Treatments Fee Configuration Cards */}
      <div className="space-y-4">
        {filteredTreatments.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-stone-200/90 shadow-2xs">
            <Layers size={32} className="mx-auto text-stone-300 mb-3" />
            <h3 className="text-sm font-bold text-neutral-900">No treatments found</h3>
            <p className="text-xs text-stone-500 mt-1">
              Try adjusting your search query or category filter.
            </p>
          </div>
        ) : (
          filteredTreatments.map(treatment => {
            const options = Array.isArray(treatment.options) ? treatment.options : [];

            return (
              <div
                key={treatment.id}
                className="bg-white rounded-2xl p-5 border border-stone-200/90 shadow-2xs hover:border-amber-400 transition-all space-y-4"
              >
                {/* Treatment Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-100">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-sm shrink-0">
                      <Sparkles size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm sm:text-base font-extrabold text-neutral-900">
                          {treatment.title}
                        </h3>
                        {treatment.is_pinned && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                            Spotlight
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-500 capitalize mt-0.5">
                        Category: <span className="font-semibold text-stone-700">{treatment.category || 'General'}</span>
                      </p>
                    </div>
                  </div>

                  <span className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded-full self-start sm:self-auto ${
                    treatment.is_published !== false 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                      : 'bg-stone-100 text-stone-600'
                  }`}>
                    {treatment.is_published !== false ? 'Live on Website' : 'Draft'}
                  </span>
                </div>

                {/* Duration Tiers Table / Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {options.map((opt, idx) => {
                    const durationStr = String(opt.duration || '').trim();
                    const normDur = durationStr.replace(/min/i, '').trim();
                    const key = `${treatment.id}-${durationStr}`;
                    
                    const existingFeeObj = feesMap.get(key) || feesMap.get(`${treatment.id}-${normDur}`);
                    const configuredFee = existingFeeObj ? existingFeeObj.fee : null;

                    const retailPriceNum = Number(String(opt.price || '0').replace(/\D/g, '')) || 0;
                    const currentInputValue = feeInputs[key] !== undefined 
                      ? feeInputs[key] 
                      : (configuredFee || '');

                    const currentFeeNum = Number(String(currentInputValue || configuredFee || '0').replace(/\D/g, '')) || 0;
                    const margin = retailPriceNum > 0 && currentFeeNum > 0 ? (retailPriceNum - currentFeeNum) : 0;
                    const marginPct = retailPriceNum > 0 && currentFeeNum > 0 ? Math.round((margin / retailPriceNum) * 100) : 0;

                    const isSaving = savingKey === key;
                    const isJustSaved = savedKey === key;

                    return (
                      <div
                        key={idx}
                        className={`rounded-xl p-3.5 border transition-all ${
                          configuredFee 
                            ? 'bg-stone-50/60 border-stone-200' 
                            : 'bg-amber-50/40 border-amber-200/80'
                        }`}
                      >
                        {/* Tier Title and Price */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5">
                            <Clock size={13} className="text-stone-400" />
                            <span className="text-xs font-mono font-extrabold text-neutral-900">
                              {durationStr} {durationStr.toLowerCase().includes('min') ? '' : 'Min'}
                            </span>
                          </div>
                          <span className="text-xs font-mono font-bold text-neutral-900">
                            Rp {retailPriceNum.toLocaleString('id-ID')}
                          </span>
                        </div>

                        {/* Status Label */}
                        <div className="flex items-center justify-between text-[11px] mb-2 text-stone-500">
                          <span>Therapist Fee:</span>
                          {configuredFee ? (
                            <span className="font-mono font-bold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded text-[10px]">
                              Rp {Number(configuredFee).toLocaleString('id-ID')}
                            </span>
                          ) : (
                            <span className="font-mono font-bold text-amber-700 bg-amber-100/80 px-1.5 py-0.5 rounded text-[10px]">
                              Not Set
                            </span>
                          )}
                        </div>

                        {/* Input Field with Quick Presets */}
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
                              placeholder={configuredFee ? String(configuredFee) : "Enter wage e.g. 150000"}
                              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-stone-200 bg-white text-xs font-mono font-semibold text-neutral-900 focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400"
                            />
                          </div>

                          {/* Quick Preset Buttons (40%, 45%, 50%) */}
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

                        {/* Margin calculation if fee entered */}
                        {currentFeeNum > 0 && retailPriceNum > 0 && (
                          <div className="mt-2 pt-2 border-t border-stone-200/80 flex items-center justify-between text-[10px] font-mono text-stone-500">
                            <span>Gross Margin:</span>
                            <span className={margin > 0 ? 'text-emerald-700 font-bold' : 'text-rose-600 font-bold'}>
                              Rp {margin.toLocaleString('id-ID')} ({marginPct}%)
                            </span>
                          </div>
                        )}

                        {/* Action buttons */}
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
                            {isSaving ? (
                              <RefreshCw size={12} className="animate-spin text-[#facc15]" />
                            ) : isJustSaved ? (
                              <>
                                <Check size={12} />
                                <span>Saved</span>
                              </>
                            ) : (
                              <span>Save Fee</span>
                            )}
                          </button>

                          {configuredFee && (
                            <button
                              type="button"
                              onClick={() => handleDeleteTier(treatment.id, durationStr)}
                              title="Remove Fee"
                              className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all cursor-pointer"
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
          })
        )}
      </div>
    </div>
  );
}
