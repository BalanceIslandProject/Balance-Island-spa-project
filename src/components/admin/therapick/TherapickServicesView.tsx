'use client';

import React, { useState, useMemo } from 'react';
import { 
  Sparkles, Layers, Search, Plus, Star, Eye, EyeOff, 
  Edit3, Trash2, CheckCircle2, Clock, DollarSign, X, 
  RefreshCw, Check, AlertCircle, ArrowUpRight
} from 'lucide-react';
import { useTherapickAdmin } from '@/context/TherapickAdminContext';
import { Treatment, TreatmentOption } from '@/context/SpaContext';

interface EditModalState {
  isOpen: boolean;
  isNew: boolean;
  id?: string;
  title: string;
  category: string;
  desc: string;
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
    therapistFees,
    togglePinTreatment, 
    togglePublishTreatment, 
    saveTreatment, 
    deleteTreatment, 
    refreshData, 
    loading 
  } = useTherapickAdmin();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'pinned' | 'draft'>('all');
  const [viewLayout, setViewLayout] = useState<'table' | 'grid'>('table');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal State for Add / Edit
  const [modalState, setModalState] = useState<EditModalState>({
    isOpen: false,
    isNew: false,
    title: '',
    category: 'Massage',
    desc: '',
    options: [...DEFAULT_OPTIONS],
    is_pinned: false,
    is_published: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Map therapist fees for quick lookup
  const feeMap = useMemo(() => {
    const map = new Map<string, string>();
    therapistFees.forEach(f => {
      const normDur = String(f.duration || '').replace(/min/i, '').trim();
      map.set(`${f.treatment_id}-${normDur}`, f.fee);
      map.set(`${f.treatment_id}-${f.duration}`, f.fee);
    });
    return map;
  }, [therapistFees]);

  // Metrics summary
  const metrics = useMemo(() => {
    const published = treatments.filter(t => t.is_published !== false);
    const pinned = treatments.filter(t => Boolean(t.is_pinned));
    return {
      total: treatments.length,
      published: published.length,
      pinned: pinned.length,
      categoriesCount: categories.length
    };
  }, [treatments, categories]);

  // Filtered treatments
  const filteredTreatments = useMemo(() => {
    return treatments.filter(t => {
      const titleMatch = (t.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.desc || '').toLowerCase().includes(searchQuery.toLowerCase());
      const catMatch = selectedCategory === 'all' || (t.category && t.category.toLowerCase() === selectedCategory.toLowerCase());

      if (!titleMatch || !catMatch) return false;

      if (statusFilter === 'published') return t.is_published !== false;
      if (statusFilter === 'draft') return t.is_published === false;
      if (statusFilter === 'pinned') return Boolean(t.is_pinned);

      return true;
    });
  }, [treatments, searchQuery, selectedCategory, statusFilter]);

  // Toggle Spotlight Pin
  const handleTogglePin = async (treatment: Treatment) => {
    const newPinned = !treatment.is_pinned;
    const res = await togglePinTreatment(treatment.id, newPinned);
    if (res.success) {
      showToast(newPinned ? `"${treatment.title}" pinned to Hero Spotlight.` : `Removed from Hero Spotlight.`);
    } else {
      showToast(res.error || 'Failed to update spotlight status');
    }
  };

  // Toggle Live Published Status
  const handleTogglePublish = async (treatment: Treatment) => {
    const newPublished = treatment.is_published === false ? true : false;
    const res = await togglePublishTreatment(treatment.id, newPublished);
    if (res.success) {
      showToast(newPublished ? `"${treatment.title}" is now Live on Website.` : `"${treatment.title}" set to Draft.`);
    } else {
      showToast(res.error || 'Failed to update published status');
    }
  };

  // Delete Treatment
  const handleDelete = async (treatment: Treatment) => {
    if (!confirm(`Are you sure you want to delete "${treatment.title}" from the catalog? This will remove it from the live website.`)) {
      return;
    }
    const res = await deleteTreatment(treatment.id);
    if (res.success) {
      showToast(`Treatment "${treatment.title}" deleted.`);
    } else {
      showToast(res.error || 'Failed to delete treatment');
    }
  };

  // Open Edit Modal
  const openEditModal = (treatment: Treatment) => {
    setModalState({
      isOpen: true,
      isNew: false,
      id: treatment.id,
      title: treatment.title,
      category: treatment.category || 'Massage',
      desc: treatment.desc || '',
      options: Array.isArray(treatment.options) && treatment.options.length > 0 
        ? treatment.options.map(o => ({ duration: String(o.duration || '60'), price: String(o.price || '350000') }))
        : [...DEFAULT_OPTIONS],
      is_pinned: Boolean(treatment.is_pinned),
      is_published: treatment.is_published !== false
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
      options: [...DEFAULT_OPTIONS],
      is_pinned: false,
      is_published: true
    });
  };

  // Save Modal Form
  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalState.title.trim()) {
      showToast('Please enter a treatment title.');
      return;
    }

    setIsSubmitting(true);
    const cleanOptions = modalState.options.map(opt => ({
      duration: String(opt.duration || '60').trim(),
      price: String(opt.price || '0').replace(/\D/g, '')
    }));

    const payload: Partial<Treatment> & { id?: string } = {
      ...(modalState.id ? { id: modalState.id } : {}),
      title: modalState.title.trim().toUpperCase(),
      category: modalState.category.trim(),
      desc: modalState.desc.trim(),
      options: cleanOptions,
      is_pinned: modalState.is_pinned,
      is_published: modalState.is_published,
      bgPattern: 'leaves'
    };

    const res = await saveTreatment(payload);
    setIsSubmitting(false);

    if (res.success) {
      showToast(modalState.isNew ? 'New treatment added to live catalog!' : 'Treatment updated successfully!');
      setModalState(prev => ({ ...prev, isOpen: false }));
    } else {
      showToast(res.error || 'Failed to save treatment');
    }
  };

  // Option row management in modal
  const handleAddOption = () => {
    setModalState(prev => ({
      ...prev,
      options: [...prev.options, { duration: '90', price: '450000' }]
    }));
  };

  const handleRemoveOption = (index: number) => {
    setModalState(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  const handleOptionChange = (index: number, field: 'duration' | 'price', value: string) => {
    setModalState(prev => {
      const next = [...prev.options];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, options: next };
    });
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
            <Layers className="text-amber-500" size={24} />
            Live Treatment Catalog
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Real treatments directly active on booktherapick.com. Manage pricing options, hero spotlight, and service details.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => refreshData()}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-stone-200 hover:border-amber-400 text-neutral-800 text-xs font-semibold shadow-2xs hover:shadow-xs transition-all cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-amber-600' : 'text-stone-500'} />
            <span className="hidden sm:inline">Sync</span>
          </button>

          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FACC15] hover:bg-amber-400 text-neutral-950 text-xs font-bold shadow-xs hover:shadow transition-all cursor-pointer"
          >
            <Plus size={15} />
            <span>Add Service</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl p-4 border border-stone-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-stone-400 mb-1.5">
            <span className="text-[11px] font-mono uppercase font-bold tracking-wider">Catalog Treatments</span>
            <Layers size={14} className="text-stone-400" />
          </div>
          <div className="text-2xl font-extrabold text-neutral-900 font-mono">
            {metrics.total}
          </div>
          <p className="text-[11px] text-stone-500 mt-1">
            Registered in Therapick catalog
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-stone-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-stone-400 mb-1.5">
            <span className="text-[11px] font-mono uppercase font-bold tracking-wider">Live on Website</span>
            <Eye size={14} className="text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-700 font-mono">
            {metrics.published} <span className="text-xs font-normal text-stone-400 font-sans">/ {metrics.total}</span>
          </div>
          <p className="text-[11px] text-stone-500 mt-1">
            Visible to clients online
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-stone-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-stone-400 mb-1.5">
            <span className="text-[11px] font-mono uppercase font-bold tracking-wider">Hero Spotlight</span>
            <Star size={14} className="text-amber-500 fill-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-neutral-900 font-mono">
            {metrics.pinned}
          </div>
          <p className="text-[11px] text-stone-500 mt-1">
            Featured at top of homepage
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-stone-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-stone-400 mb-1.5">
            <span className="text-[11px] font-mono uppercase font-bold tracking-wider">Categories</span>
            <Sparkles size={14} className="text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-neutral-900 font-mono">
            {metrics.categoriesCount}
          </div>
          <p className="text-[11px] text-stone-500 mt-1">
            Specialized service types
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
              placeholder="Search treatments by title or description..."
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
              All ({treatments.length})
            </button>
            <button
              onClick={() => setStatusFilter('published')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                statusFilter === 'published' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              Live ({metrics.published})
            </button>
            <button
              onClick={() => setStatusFilter('pinned')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                statusFilter === 'pinned' ? 'bg-white text-amber-800 shadow-2xs' : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              Spotlight ({metrics.pinned})
            </button>
            <button
              onClick={() => setStatusFilter('draft')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                statusFilter === 'draft' ? 'bg-white text-stone-800 shadow-2xs' : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              Drafts ({metrics.total - metrics.published})
            </button>
          </div>
        </div>

        {/* Category Filter Pills */}
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

        {/* View Layout Toggle */}
        <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs">
          <span className="text-stone-500 font-medium">
            Showing {filteredTreatments.length} treatments
          </span>
          <div className="flex items-center gap-1 bg-stone-100 p-0.5 rounded-lg text-[11px] font-semibold">
            <button
              type="button"
              onClick={() => setViewLayout('table')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                viewLayout === 'table' ? 'bg-white text-neutral-900 shadow-2xs font-bold' : 'text-stone-500'
              }`}
            >
              Table View
            </button>
            <button
              type="button"
              onClick={() => setViewLayout('grid')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                viewLayout === 'grid' ? 'bg-white text-neutral-900 shadow-2xs font-bold' : 'text-stone-500'
              }`}
            >
              Card View
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TABLE VIEW (MATCHING MOCKUP IMAGE 2 BOTTOM LEFT)
         ───────────────────────────────────────────────────────────── */}
      {viewLayout === 'table' ? (
        <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/50 text-[11px] font-mono uppercase font-bold text-stone-500">
                  <th className="py-3 px-4">Service</th>
                  <th className="py-3 px-4">Duration & Pricing Tiers</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredTreatments.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-stone-400">
                      No services match your filters.
                    </td>
                  </tr>
                ) : (
                  filteredTreatments.map(t => {
                    const opts = Array.isArray(t.options) ? t.options : [];
                    const isLive = t.is_published !== false;
                    const isSpotlight = Boolean(t.is_pinned);

                    return (
                      <tr
                        key={t.id}
                        className="hover:bg-amber-50/20 transition-colors group"
                      >
                        {/* Service Title & Category */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-100/80 text-amber-900 flex items-center justify-center shrink-0 border border-amber-200/60">
                              <Sparkles size={18} className="text-amber-700" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-neutral-900 text-xs sm:text-sm group-hover:text-amber-900 transition-colors">
                                  {t.title}
                                </span>
                                {isSpotlight && (
                                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#facc15] text-neutral-950 font-bold shadow-2xs">
                                    ★ Spotlight
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-stone-400 capitalize">
                                {t.category || 'Massage'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Duration & Price Tiers */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {opts.map((opt, i) => {
                              const numPrice = Number(String(opt.price || '0').replace(/\D/g, '')) || 0;
                              return (
                                <span
                                  key={i}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-50 border border-stone-200/80 font-mono text-xs"
                                >
                                  <span className="font-bold text-neutral-800">
                                    {opt.duration}{String(opt.duration).includes('min') ? '' : 'm'}
                                  </span>
                                  <span className="text-stone-300">•</span>
                                  <span className="font-bold text-neutral-900">
                                    Rp {numPrice.toLocaleString('id-ID')}
                                  </span>
                                </span>
                              );
                            })}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                            isLive 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-stone-100 text-stone-600'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-500' : 'bg-stone-400'}`} />
                            <span>{isLive ? 'Active' : 'Draft'}</span>
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEditModal(t)}
                              className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-[#facc15] text-neutral-900 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                            >
                              <Edit3 size={12} />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(t)}
                              className="p-1.5 rounded-lg text-stone-300 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete Treatment"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Treatments Grid */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredTreatments.map(treatment => {
            const options = Array.isArray(treatment.options) ? treatment.options : [];
            const isLive = treatment.is_published !== false;
            const isSpotlight = Boolean(treatment.is_pinned);

            return (
              <div
                key={treatment.id}
                className="bg-white rounded-2xl p-5 border border-stone-200/90 shadow-2xs hover:border-amber-400 transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  {/* Top Bar: Category Pill & Action Controls */}
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <span className="text-[10px] font-mono uppercase font-bold tracking-wider px-2.5 py-0.5 rounded bg-stone-100 text-stone-700">
                      {treatment.category || 'Treatment'}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {/* Spotlight Pin Toggle */}
                      <button
                        type="button"
                        onClick={() => handleTogglePin(treatment)}
                        title={isSpotlight ? 'Remove from Hero Spotlight' : 'Pin to Hero Spotlight'}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold font-mono transition-all cursor-pointer ${
                          isSpotlight
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-stone-100 text-stone-500 hover:text-amber-800 hover:bg-amber-50'
                        }`}
                      >
                        <Star size={12} className={isSpotlight ? 'fill-amber-500 text-amber-600' : 'text-stone-400'} />
                        <span>{isSpotlight ? 'Spotlight' : 'Pin'}</span>
                      </button>

                      {/* Publish / Draft Toggle */}
                      <button
                        type="button"
                        onClick={() => handleTogglePublish(treatment)}
                        title={isLive ? 'Set to Draft' : 'Publish to Website'}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold font-mono transition-all cursor-pointer ${
                          isLive
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-stone-200 text-stone-600'
                        }`}
                      >
                        {isLive ? <Eye size={12} /> : <EyeOff size={12} />}
                        <span>{isLive ? 'Live' : 'Draft'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base font-extrabold text-neutral-900 tracking-tight">
                    {treatment.title}
                  </h3>
                  <p className="text-xs text-stone-500 line-clamp-2 mt-1 leading-relaxed">
                    {treatment.desc || 'Signature in-villa therapeutic treatment crafted with traditional Balinese wellness techniques.'}
                  </p>
                </div>

                {/* Duration & Pricing Options Table */}
                <div className="space-y-1.5 pt-3 border-t border-stone-100">
                  <div className="text-[10px] font-mono uppercase font-bold tracking-wider text-stone-400 mb-1">
                    Duration & Pricing Tiers
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {options.map((opt, idx) => {
                      const durStr = String(opt.duration || '').trim();
                      const normDur = durStr.replace(/min/i, '').trim();
                      const numPrice = Number(String(opt.price || '0').replace(/\D/g, '')) || 0;
                      const fee = feeMap.get(`${treatment.id}-${durStr}`) || feeMap.get(`${treatment.id}-${normDur}`);

                      return (
                        <div key={idx} className="bg-stone-50 rounded-xl p-2.5 border border-stone-200/70">
                          <div className="flex items-center justify-between text-stone-500 text-[11px] mb-1">
                            <span className="font-mono font-bold text-neutral-900">
                              {durStr} {durStr.toLowerCase().includes('min') ? '' : 'Min'}
                            </span>
                            <Clock size={11} className="text-stone-400" />
                          </div>
                          <div className="text-xs font-mono font-extrabold text-neutral-900">
                            Rp {numPrice.toLocaleString('id-ID')}
                          </div>
                          <div className="text-[10px] font-mono text-stone-400 mt-1 flex items-center justify-between">
                            <span>Wage:</span>
                            <span className={fee ? 'text-emerald-700 font-bold' : 'text-amber-700 font-medium'}>
                              {fee ? `Rp ${Number(fee).toLocaleString('id-ID')}` : 'Not set'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => openEditModal(treatment)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-neutral-800 text-xs font-bold transition-all cursor-pointer"
                  >
                    <Edit3 size={12} />
                    <span>Edit Treatment</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(treatment)}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                    title="Delete Treatment"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Treatment Modal */}
      {modalState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
              <div>
                <h2 className="text-base font-bold text-neutral-900">
                  {modalState.isNew ? 'Add New Treatment' : 'Edit Treatment'}
                </h2>
                <p className="text-xs text-stone-500">
                  Configure live service details, pricing tiers, and visibility on booktherapick.com.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalState(prev => ({ ...prev, isOpen: false }))}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveModal} className="p-6 overflow-y-auto space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  Treatment Title *
                </label>
                <input
                  type="text"
                  required
                  value={modalState.title}
                  onChange={e => setModalState(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. BALINESE TRADITIONAL MASSAGE"
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 bg-stone-50/50 text-xs font-semibold text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400"
                />
              </div>

              {/* Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    Category *
                  </label>
                  <select
                    value={modalState.category}
                    onChange={e => setModalState(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-200 bg-white text-xs font-semibold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400"
                  >
                    <option value="Massage">Massage</option>
                    <option value="Facial">Facial</option>
                    <option value="Package">Package</option>
                    <option value="Body Scrub">Body Scrub</option>
                    <option value="Treatment">Treatment</option>
                  </select>
                </div>

                {/* Published & Spotlight Toggles */}
                <div className="flex items-center gap-3 pt-6">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-neutral-800">
                    <input
                      type="checkbox"
                      checked={modalState.is_published}
                      onChange={e => setModalState(prev => ({ ...prev, is_published: e.target.checked }))}
                      className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 border-stone-300"
                    />
                    <span>Live Published</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-neutral-800">
                    <input
                      type="checkbox"
                      checked={modalState.is_pinned}
                      onChange={e => setModalState(prev => ({ ...prev, is_pinned: e.target.checked }))}
                      className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 border-stone-300"
                    />
                    <span>Spotlight Pin</span>
                  </label>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={modalState.desc}
                  onChange={e => setModalState(prev => ({ ...prev, desc: e.target.value }))}
                  placeholder="Detailed treatment description, techniques, and organic ingredients used..."
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 bg-stone-50/50 text-xs text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400"
                />
              </div>

              {/* Duration & Price Tiers */}
              <div className="space-y-2 pt-2 border-t border-stone-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                    Duration & Pricing Options
                  </label>
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="text-xs font-bold text-amber-700 hover:text-amber-900 cursor-pointer flex items-center gap-1"
                  >
                    <Plus size={13} />
                    <span>Add Tier</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {modalState.options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-1/3">
                        <input
                          type="text"
                          value={opt.duration}
                          onChange={e => handleOptionChange(i, 'duration', e.target.value)}
                          placeholder="e.g. 60 or 90 Min"
                          className="w-full px-3 py-1.5 rounded-lg border border-stone-200 bg-stone-50/50 text-xs font-mono font-semibold text-neutral-900"
                        />
                      </div>
                      <div className="flex-1 relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono text-stone-400 font-bold">
                          Rp
                        </span>
                        <input
                          type="text"
                          value={opt.price}
                          onChange={e => handleOptionChange(i, 'price', e.target.value)}
                          placeholder="e.g. 350000"
                          className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-stone-200 bg-stone-50/50 text-xs font-mono font-semibold text-neutral-900"
                        />
                      </div>
                      {modalState.options.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(i)}
                          className="p-1.5 text-stone-400 hover:text-rose-600 transition-all cursor-pointer"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalState(prev => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#0F172A] hover:bg-neutral-800 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? <RefreshCw size={14} className="animate-spin text-[#facc15]" /> : <Check size={14} />}
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
