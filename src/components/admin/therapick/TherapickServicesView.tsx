'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, PlusCircle, Pin, Edit3, Trash2, Check, RefreshCw, X, Plus, Layers,
  SlidersHorizontal, TrendingDown, TrendingUp, ShieldCheck, CheckCircle2, RotateCcw
} from 'lucide-react';
import { useTherapickAdmin } from '@/context/TherapickAdminContext';
import { Treatment, TreatmentOption } from '@/context/SpaContext';
import { calculateDynamicPrice } from '@/lib/dynamicPricing';

interface ModalState {
  isOpen: boolean;
  isNew: boolean;
  id?: string;
  title: string;
  category: string;
  desc: string;
  benefits: string[];
  options: TreatmentOption[];
  is_pinned: boolean;
  is_published: boolean;
}

const DEFAULT_OPTIONS: TreatmentOption[] = [
  { duration: '60', price: '350000' },
  { duration: '90', price: '500000' },
  { duration: '120', price: '650000' }
];

export default function TherapickServicesView() {
  const { 
    treatments, 
    togglePinTreatment, 
    togglePublishTreatment, 
    saveTreatment, 
    deleteTreatment, 
    refreshData, 
    loading,
    dynamicPricingPercentage,
    saveDynamicPricing
  } = useTherapickAdmin();

  const [menuSearch, setMenuSearch] = useState('');
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    isNew: false,
    title: '',
    category: 'Massage',
    desc: '',
    benefits: [''],
    options: [...DEFAULT_OPTIONS],
    is_pinned: false,
    is_published: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dynamic pricing controls state
  const [pricingInput, setPricingInput] = useState<number>(dynamicPricingPercentage || 0);
  const [isSavingPricing, setIsSavingPricing] = useState(false);
  const [pricingSuccessMessage, setPricingSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setPricingInput(dynamicPricingPercentage || 0);
  }, [dynamicPricingPercentage]);

  const handleSavePricing = async () => {
    setIsSavingPricing(true);
    setPricingSuccessMessage(null);
    try {
      const res = await saveDynamicPricing(pricingInput);
      if (res.success) {
        setPricingSuccessMessage(
          pricingInput === 0 
            ? 'Catalog pricing reset to Standard (0%).' 
            : `Dynamic pricing set to ${pricingInput > 0 ? `+${pricingInput}%` : `${pricingInput}%`} and synced live.`
        );
        setTimeout(() => setPricingSuccessMessage(null), 5000);
      } else {
        alert(res.error || 'Failed to save dynamic pricing setting.');
      }
    } finally {
      setIsSavingPricing(false);
    }
  };

  // Filtered treatments
  const filteredTreatments = useMemo(() => {
    return treatments.filter(t => 
      t.title.toLowerCase().includes(menuSearch.toLowerCase()) || 
      (t.category && t.category.toLowerCase().includes(menuSearch.toLowerCase()))
    );
  }, [treatments, menuSearch]);

  // Open Edit Modal
  const openEditModal = (t: Treatment) => {
    setModalState({
      isOpen: true,
      isNew: false,
      id: t.id,
      title: t.title,
      category: t.category || 'Massage',
      desc: t.desc || '',
      benefits: Array.isArray(t.benefits) && t.benefits.length > 0 ? t.benefits : [''],
      options: Array.isArray(t.options) && t.options.length > 0
        ? t.options.map(o => ({ ...o, price: o.base_price || o.price }))
        : [...DEFAULT_OPTIONS],
      is_pinned: Boolean(t.is_pinned),
      is_published: t.is_published !== false
    });
  };

  // Open Add Modal
  const openAddModal = () => {
    setModalState({
      isOpen: true,
      isNew: true,
      title: '',
      category: 'Massage',
      desc: '',
      benefits: [''],
      options: [...DEFAULT_OPTIONS],
      is_pinned: false,
      is_published: true
    });
  };

  // Option handlers
  const handleOptionChange = (idx: number, field: 'duration' | 'price', val: string) => {
    setModalState(prev => {
      const next = [...prev.options];
      next[idx] = { ...next[idx], [field]: val };
      return { ...prev, options: next };
    });
  };

  const handleAddOption = () => {
    setModalState(prev => ({
      ...prev,
      options: [...prev.options, { duration: '90', price: '450000' }]
    }));
  };

  const handleRemoveOption = (idx: number) => {
    setModalState(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== idx)
    }));
  };

  // Benefit handlers
  const handleBenefitChange = (idx: number, val: string) => {
    setModalState(prev => {
      const next = [...prev.benefits];
      next[idx] = val;
      return { ...prev, benefits: next };
    });
  };

  const handleAddBenefit = () => {
    setModalState(prev => ({
      ...prev,
      benefits: [...prev.benefits, '']
    }));
  };

  const handleRemoveBenefit = (idx: number) => {
    setModalState(prev => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== idx)
    }));
  };

  // Save Treatment
  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalState.title.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await saveTreatment({
        id: modalState.id,
        title: modalState.title.trim().toUpperCase(),
        category: modalState.category,
        desc: modalState.desc,
        benefits: modalState.benefits.filter(b => b.trim().length > 0),
        options: modalState.options,
        is_pinned: modalState.is_pinned,
        is_published: modalState.is_published,
        brand: 'therapick'
      });

      if (res.success) {
        setModalState(prev => ({ ...prev, isOpen: false }));
        await refreshData();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Treatment
  const handleDelete = async (t: Treatment) => {
    if (!confirm(`Are you sure you want to delete "${t.title}" from Therapick treatments?`)) {
      return;
    }
    const res = await deleteTreatment(t.id);
    if (res.success) {
      await refreshData();
    }
  };

  // Toggle Pin
  const handleTogglePin = async (t: Treatment) => {
    await togglePinTreatment(t.id, !t.is_pinned);
  };

  return (
    <div className="space-y-6">
      
      {/* ─── FITLO PAGE HEADER ─── */}
      <div className="fitlo-page-head">
        <div>
          <h1 className="fitlo-page-title">Treatment Catalog</h1>
          <p className="fitlo-page-sub">
            Browse, search, edit, or pin spa rituals and pricing packages for Therapick.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto items-stretch sm:items-center">
          <div className="w-full sm:w-64 relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--fitlo-muted)]" />
            <input
              type="text"
              placeholder="Search treatments..."
              value={menuSearch}
              onChange={e => setMenuSearch(e.target.value)}
              className="fitlo-input w-full pl-9"
            />
          </div>

          <button 
            type="button"
            onClick={openAddModal}
            className="fitlo-btn fitlo-btn--primary"
          >
            <PlusCircle size={15} />
            <span>Add Treatment</span>
          </button>
        </div>
      </div>

      {/* ─── FITLO 4 PASTEL KPI TILES ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="fitlo-kpi fitlo-kpi--peach">
          <div className="fitlo-kpi__lbl">Total Treatments</div>
          <div className="fitlo-kpi__val">{treatments.length}</div>
          <div className="fitlo-kpi__sub">In current catalog</div>
        </div>

        <div className="fitlo-kpi fitlo-kpi--cyan">
          <div className="fitlo-kpi__lbl">Pinned Most Booked</div>
          <div className="fitlo-kpi__val">{treatments.filter(t => t.is_pinned).length}</div>
          <div className="fitlo-kpi__sub">Featured on booking menu</div>
        </div>

        <div className="fitlo-kpi fitlo-kpi--lemon">
          <div className="fitlo-kpi__lbl">Categories</div>
          <div className="fitlo-kpi__val">{new Set(treatments.map(t => t.category)).size}</div>
          <div className="fitlo-kpi__sub">Unique ritual types</div>
        </div>

        <div className="fitlo-kpi fitlo-kpi--pebble">
          <div className="fitlo-kpi__lbl">Brand Scope</div>
          <div className="fitlo-kpi__val flex items-center gap-1.5 text-base sm:text-lg">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--fitlo-accent)]" />
            <span>Therapick</span>
          </div>
          <div className="fitlo-kpi__sub">Active catalogue</div>
        </div>
      </div>

      {/* ─── FITLO DYNAMIC PRICING CONTROL CARD ─── */}
      <div className="fitlo-card p-5 sm:p-6 border border-[rgba(11,122,115,0.2)] bg-gradient-to-br from-[var(--fitlo-card)] to-[rgba(11,122,115,0.03)] shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[var(--fitlo-line)]">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="w-8 h-8 rounded-xl bg-[rgba(11,122,115,0.1)] text-[var(--fitlo-accent)] flex items-center justify-center shrink-0">
                <SlidersHorizontal size={16} />
              </div>
              <h2 className="text-base font-bold text-[var(--fitlo-ink)] tracking-tight">
                Global Dynamic Pricing Setting
              </h2>
              {dynamicPricingPercentage < 0 ? (
                <span className="fitlo-pill fitlo-pill--success font-bold text-xs flex items-center gap-1">
                  <TrendingDown size={12} />
                  Active: {Math.abs(dynamicPricingPercentage)}% Off Catalog
                </span>
              ) : dynamicPricingPercentage > 0 ? (
                <span className="fitlo-pill fitlo-pill--warning font-bold text-xs flex items-center gap-1">
                  <TrendingUp size={12} />
                  Active: +{dynamicPricingPercentage}% Markup
                </span>
              ) : (
                <span className="fitlo-pill fitlo-pill--neutral font-medium text-xs">
                  Standard 0% (Catalog Rates)
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--fitlo-muted)] leading-relaxed">
              Set a universal percentage adjustment (e.g. <b>-5%</b> for a site-wide discount, <b>+5%</b> for high-season markup). Applies across all customer treatment cards and booking drawers.
            </p>
          </div>

          {/* Exemption Notice Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--fitlo-card-2)] border border-[var(--fitlo-line)] shrink-0 self-start lg:self-center">
            <ShieldCheck size={14} className="text-[var(--fitlo-accent)] shrink-0" />
            <span className="text-[11px] font-semibold text-[var(--fitlo-ink)]">
              Campaign Cards Exempt
            </span>
          </div>
        </div>

        {/* Controls Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-4 items-center">
          {/* Quick Presets */}
          <div className="lg:col-span-6 space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--fitlo-muted)] block">
              Quick Presets
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { label: '-10%', val: -10, hint: 'Sale' },
                { label: '-5%', val: -5, hint: 'Promo' },
                { label: '0%', val: 0, hint: 'Standard' },
                { label: '+5%', val: 5, hint: 'Peak' },
                { label: '+10%', val: 10, hint: 'Holiday' }
              ].map(preset => {
                const isSelected = pricingInput === preset.val;
                return (
                  <button
                    key={preset.val}
                    type="button"
                    onClick={() => setPricingInput(preset.val)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-[var(--fitlo-ink)] text-white shadow-xs'
                        : 'bg-[var(--fitlo-card-2)] border border-[var(--fitlo-line)] text-[var(--fitlo-ink)] hover:border-[var(--fitlo-ink)]'
                    }`}
                  >
                    <span>{preset.label}</span>
                    <span className={`text-[9px] font-medium opacity-70 ${isSelected ? 'text-white' : 'text-[var(--fitlo-muted)]'}`}>
                      {preset.hint}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stepper / Custom Number Input */}
          <div className="lg:col-span-3 space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--fitlo-muted)] block">
              Custom Adjustment (%)
            </label>
            <div className="flex items-center gap-1.5 bg-[var(--fitlo-card-2)] border border-[var(--fitlo-line)] rounded-xl p-1">
              <button
                type="button"
                onClick={() => setPricingInput(prev => Math.max(-90, prev - 1))}
                className="w-8 h-8 rounded-lg bg-[var(--fitlo-card)] border border-[var(--fitlo-line)] flex items-center justify-center font-bold text-sm text-[var(--fitlo-ink)] hover:bg-[var(--fitlo-card-2)] transition-colors cursor-pointer"
              >
                -
              </button>
              <div className="flex-1 relative flex items-center justify-center">
                <input
                  type="number"
                  min="-90"
                  max="200"
                  step="1"
                  value={pricingInput}
                  onChange={e => setPricingInput(Number(e.target.value) || 0)}
                  className="w-full text-center font-bold text-sm bg-transparent outline-none text-[var(--fitlo-ink)] fitlo-num"
                />
                <span className="text-xs font-bold text-[var(--fitlo-muted)] pr-1">%</span>
              </div>
              <button
                type="button"
                onClick={() => setPricingInput(prev => Math.min(200, prev + 1))}
                className="w-8 h-8 rounded-lg bg-[var(--fitlo-card)] border border-[var(--fitlo-line)] flex items-center justify-center font-bold text-sm text-[var(--fitlo-ink)] hover:bg-[var(--fitlo-card-2)] transition-colors cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          {/* Action Save Button */}
          <div className="lg:col-span-3 flex flex-col sm:flex-row lg:flex-col gap-2 pt-1 lg:pt-5">
            <button
              type="button"
              onClick={handleSavePricing}
              disabled={isSavingPricing || (pricingInput === dynamicPricingPercentage && pricingSuccessMessage === null)}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
                pricingInput !== dynamicPricingPercentage
                  ? 'bg-[var(--fitlo-accent)] text-white hover:opacity-90 active:scale-[0.99]'
                  : 'bg-[var(--fitlo-card-2)] text-[var(--fitlo-muted)] border border-[var(--fitlo-line)] cursor-not-allowed'
              }`}
            >
              {isSavingPricing ? (
                <>
                  <RefreshCw size={13} className="animate-spin" />
                  <span>Saving Live Pricing...</span>
                </>
              ) : pricingInput !== dynamicPricingPercentage ? (
                <>
                  <Check size={14} />
                  <span>Apply & Save {pricingInput > 0 ? `+${pricingInput}%` : `${pricingInput}%`}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} className="text-[var(--fitlo-accent)]" />
                  <span>Pricing Synced</span>
                </>
              )}
            </button>

            {pricingInput !== 0 && (
              <button
                type="button"
                onClick={() => setPricingInput(0)}
                className="text-[11px] font-semibold text-[var(--fitlo-muted)] hover:text-[var(--fitlo-ink)] py-1 text-center transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <RotateCcw size={11} />
                <span>Reset to 0%</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Calculation Preview Banner */}
        <div className="mt-4 pt-3 border-t border-[var(--fitlo-line)] grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          <div className="bg-[var(--fitlo-card-2)] rounded-xl p-2.5 border border-[var(--fitlo-line)] flex items-center justify-between">
            <span className="text-[11px] font-medium text-[var(--fitlo-muted)]">60 Min Ritual</span>
            <div className="text-right">
              {pricingInput !== 0 && (
                <span className="text-[10px] text-[var(--fitlo-muted)] line-through mr-1.5 fitlo-num">
                  Rp 350.000
                </span>
              )}
              <span className="font-bold text-[var(--fitlo-ink)] fitlo-num">
                Rp {calculateDynamicPrice(350000, pricingInput).toLocaleString('en-US')}
              </span>
            </div>
          </div>

          <div className="bg-[var(--fitlo-card-2)] rounded-xl p-2.5 border border-[var(--fitlo-line)] flex items-center justify-between">
            <span className="text-[11px] font-medium text-[var(--fitlo-muted)]">90 Min Ritual</span>
            <div className="text-right">
              {pricingInput !== 0 && (
                <span className="text-[10px] text-[var(--fitlo-muted)] line-through mr-1.5 fitlo-num">
                  Rp 500.000
                </span>
              )}
              <span className="font-bold text-[var(--fitlo-ink)] fitlo-num">
                Rp {calculateDynamicPrice(500000, pricingInput).toLocaleString('en-US')}
              </span>
            </div>
          </div>

          <div className="bg-[var(--fitlo-card-2)] rounded-xl p-2.5 border border-[var(--fitlo-line)] flex items-center justify-between">
            <span className="text-[11px] font-medium text-[var(--fitlo-muted)]">120 Min Ritual</span>
            <div className="text-right">
              {pricingInput !== 0 && (
                <span className="text-[10px] text-[var(--fitlo-muted)] line-through mr-1.5 fitlo-num">
                  Rp 650.000
                </span>
              )}
              <span className="font-bold text-[var(--fitlo-ink)] fitlo-num">
                Rp {calculateDynamicPrice(650000, pricingInput).toLocaleString('en-US')}
              </span>
            </div>
          </div>
        </div>

        {/* Success Alert Banner */}
        {pricingSuccessMessage && (
          <div className="mt-3 py-2 px-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
              <span>{pricingSuccessMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setPricingSuccessMessage(null)}
              className="text-emerald-600 hover:text-emerald-900"
            >
              <X size={13} />
            </button>
          </div>
        )}
      </div>

      {/* ─── FITLO TREATMENT CARDS GRID ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTreatments.length === 0 ? (
          <div className="col-span-full fitlo-card p-12 text-center text-[var(--fitlo-muted)]">
            <Layers size={32} className="mx-auto mb-2 text-[var(--fitlo-muted)] opacity-60" />
            <p className="font-semibold text-[var(--fitlo-ink)]">No treatments match your search</p>
            <p className="text-xs text-[var(--fitlo-muted)] mt-1">Try another keyword or create a new treatment.</p>
          </div>
        ) : (
          filteredTreatments.map(t => {
            const options = Array.isArray(t.options) ? t.options : [];

            return (
              <div 
                key={t.id} 
                className="fitlo-card p-5 flex flex-col justify-between hover:border-[rgba(22,26,25,0.16)] transition-all"
              >
                <div>
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <h4 className="font-bold text-[var(--fitlo-ink)] text-sm uppercase tracking-wide pr-2">
                      {t.title}
                    </h4>
                    <span className="fitlo-pill fitlo-pill--info shrink-0 capitalize">
                      {t.category || 'Package'}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--fitlo-muted)] line-clamp-2 mb-4 leading-relaxed">
                    {t.desc || 'Enjoy a relaxing wellness experience designed to soothe the body and mind.'}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="border border-[var(--fitlo-line)] rounded-xl overflow-hidden bg-[var(--fitlo-card-2)]">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[var(--fitlo-card-2)] border-b border-[var(--fitlo-line)]">
                        <tr>
                          <th className="py-2 px-3 text-[10px] font-bold uppercase tracking-wider text-[var(--fitlo-muted)]">
                            Duration
                          </th>
                          <th className="py-2 px-3 text-[10px] font-bold uppercase tracking-wider text-[var(--fitlo-muted)] text-right">
                            Base (IDR)
                          </th>
                          {dynamicPricingPercentage !== 0 && (
                            <th className="py-2 px-3 text-[10px] font-bold uppercase tracking-wider text-[var(--fitlo-accent)] text-right">
                              Live ({dynamicPricingPercentage > 0 ? `+${dynamicPricingPercentage}%` : `${dynamicPricingPercentage}%`})
                            </th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--fitlo-line)] bg-[var(--fitlo-card)]">
                        {options.map((o, idx) => {
                          const baseNum = parseInt(String(o.base_price || o.price || '0').replace(/[^0-9]/g, '') || '0', 10);
                          const formattedBase = !isNaN(baseNum) && baseNum > 0 ? baseNum.toLocaleString('en-US') : '0';
                          const livePrice = calculateDynamicPrice(baseNum, dynamicPricingPercentage, false);
                          const formattedLive = livePrice.toLocaleString('en-US');

                          return (
                            <tr key={idx} className="hover:bg-[var(--fitlo-card-2)] transition-colors">
                              <td className="py-2.5 px-3 font-semibold text-[var(--fitlo-ink)]">
                                {o.duration} mins
                              </td>
                              <td className={`py-2.5 px-3 text-right fitlo-num ${dynamicPricingPercentage !== 0 ? 'text-[11px] text-[var(--fitlo-muted)] line-through' : 'font-bold text-[var(--fitlo-ink)]'}`}>
                                {formattedBase}
                              </td>
                              {dynamicPricingPercentage !== 0 && (
                                <td className="py-2.5 px-3 font-bold text-right fitlo-num text-[var(--fitlo-accent)]">
                                  {formattedLive}
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Bottom Action Bar (Pin, Edit, Delete) */}
                  <div className="flex gap-2 pt-1 items-center">
                    {/* Pin / Most Booked button */}
                    <button
                      type="button"
                      onClick={() => handleTogglePin(t)}
                      className={`p-2 rounded-xl transition-colors shrink-0 cursor-pointer ${
                        t.is_pinned 
                          ? 'bg-[var(--fitlo-ink)] text-[var(--fitlo-card)] shadow-xs' 
                          : 'bg-[var(--fitlo-card)] border border-[var(--fitlo-line)] text-[var(--fitlo-ink)] hover:bg-[var(--fitlo-card-2)]'
                      }`}
                      title={t.is_pinned ? "Unpin from Most Booked" : "Pin to Most Booked"}
                    >
                      <Pin size={13} className={t.is_pinned ? "fill-[var(--fitlo-card)]" : ""} />
                    </button>

                    {/* Thumbnail if pinned and available */}
                    {t.is_pinned && t.pinned_image && (
                      <img 
                        src={t.pinned_image} 
                        alt="Pinned" 
                        className="w-7 h-7 object-cover rounded-lg shrink-0 border border-[var(--fitlo-line)]" 
                      />
                    )}

                    {/* Edit button */}
                    <button
                      type="button"
                      onClick={() => openEditModal(t)}
                      className="flex-1 py-1.5 px-3 rounded-xl border border-[var(--fitlo-line)] bg-[var(--fitlo-card)] hover:bg-[var(--fitlo-card-2)] text-xs font-semibold text-[var(--fitlo-ink)] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Edit3 size={13} />
                      <span>Edit</span>
                    </button>

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => handleDelete(t)}
                      className="p-2 rounded-xl border border-[var(--fitlo-line)] bg-[var(--fitlo-card)] text-[var(--fitlo-muted)] hover:text-[var(--fitlo-bad)] hover:bg-[var(--fitlo-bad-soft)] transition-colors cursor-pointer"
                      title="Delete Treatment"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ─── ADD / EDIT TREATMENT MODAL ─── */}
      {modalState.isOpen && (
        <div className="fitlo-modal-backdrop">
          <div className="fitlo-card w-full max-w-xl p-0 overflow-hidden flex flex-col max-h-[90vh] shadow-2xl">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-[var(--fitlo-line)] flex items-center justify-between bg-[var(--fitlo-card-2)]">
              <div>
                <h2 className="text-base font-bold text-[var(--fitlo-ink)]">
                  {modalState.isNew ? 'Add Spa Treatment' : 'Edit Treatment'}
                </h2>
                <p className="text-xs text-[var(--fitlo-muted)] mt-0.5">
                  {modalState.isNew ? 'Create a new massage or package for Therapick website.' : 'Update pricing tiers and description.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalState(prev => ({ ...prev, isOpen: false }))}
                className="p-1 rounded-lg text-[var(--fitlo-muted)] hover:text-[var(--fitlo-ink)] hover:bg-[var(--fitlo-card)] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveModal} className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="text-xs font-semibold text-[var(--fitlo-ink)] mb-1.5 block">Treatment Title *</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. Traditional Balinese Massage" 
                  value={modalState.title} 
                  onChange={e => setModalState(prev => ({ ...prev, title: e.target.value }))}
                  className="fitlo-input w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[var(--fitlo-ink)] mb-1.5 block">Category</label>
                  <select 
                    value={modalState.category} 
                    onChange={e => setModalState(prev => ({ ...prev, category: e.target.value }))}
                    className="fitlo-input w-full"
                  >
                    <option value="Massage">Massage</option>
                    <option value="Package">Package</option>
                    <option value="Facial">Facial</option>
                    <option value="Ritual">Ritual</option>
                    <option value="Body Scrub">Body Scrub</option>
                  </select>
                </div>

                <div className="flex items-center gap-4 pt-6">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[var(--fitlo-ink)]">
                    <input
                      type="checkbox"
                      checked={modalState.is_pinned}
                      onChange={e => setModalState(prev => ({ ...prev, is_pinned: e.target.checked }))}
                      className="w-4 h-4 rounded border-[var(--fitlo-line)] text-[var(--fitlo-accent)] focus:ring-[var(--fitlo-accent)]"
                    />
                    <span>Most Booked Pin</span>
                  </label>
                </div>
              </div>

              {/* Duration & Pricing Options */}
              <div className="space-y-3 pt-2 border-t border-[var(--fitlo-line)]">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--fitlo-muted)]">Duration & Pricing</h4>
                    <p className="text-[11px] text-[var(--fitlo-muted)] mt-0.5">Define duration options and prices in IDR</p>
                  </div>
                  <button 
                    type="button" 
                    onClick={handleAddOption}
                    className="text-xs font-semibold text-[var(--fitlo-ink)] border border-[var(--fitlo-line)] bg-[var(--fitlo-card)] hover:bg-[var(--fitlo-card-2)] px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Plus size={13} /> Add Option
                  </button>
                </div>

                <div className="space-y-2">
                  {modalState.options.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-32 relative">
                        <input
                          type="number"
                          required
                          placeholder="60"
                          value={opt.duration}
                          onChange={e => handleOptionChange(idx, 'duration', e.target.value)}
                          className="fitlo-input w-full pl-3 pr-10 fitlo-num"
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[var(--fitlo-muted)] pointer-events-none">
                          MINS
                        </span>
                      </div>

                      <div className="flex-1 relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[var(--fitlo-muted)] pointer-events-none">
                          Rp
                        </span>
                        <input
                          type="text"
                          required
                          placeholder="450,000"
                          value={opt.price}
                          onChange={e => handleOptionChange(idx, 'price', e.target.value)}
                          className="fitlo-input w-full pl-9 fitlo-num"
                        />
                      </div>

                      {modalState.options.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(idx)}
                          className="p-1.5 text-[var(--fitlo-muted)] hover:text-[var(--fitlo-bad)] transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="pt-2 border-t border-[var(--fitlo-line)]">
                <label className="text-xs font-semibold text-[var(--fitlo-ink)] mb-1.5 block">Description</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Write details about the treatment, technique, and wellness effects..."
                  value={modalState.desc}
                  onChange={e => setModalState(prev => ({ ...prev, desc: e.target.value }))}
                  className="fitlo-input w-full resize-none leading-relaxed"
                />
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-[var(--fitlo-line)] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalState(prev => ({ ...prev, isOpen: false }))}
                  className="fitlo-btn fitlo-btn--ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="fitlo-btn fitlo-btn--primary"
                >
                  {isSubmitting ? <RefreshCw size={13} className="animate-spin" /> : <Check size={13} />}
                  <span>{modalState.isNew ? 'Create Treatment' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
