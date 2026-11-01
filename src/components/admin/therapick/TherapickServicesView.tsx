'use client';

import React, { useState, useMemo } from 'react';
import { 
  Search, PlusCircle, Pin, Edit3, Trash2, Check, RefreshCw, X, Plus, Layers
} from 'lucide-react';
import { useTherapickAdmin } from '@/context/TherapickAdminContext';
import { Treatment, TreatmentOption } from '@/context/SpaContext';

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
    loading 
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
      options: Array.isArray(t.options) && t.options.length > 0 ? t.options : [...DEFAULT_OPTIONS],
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
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* ─────────────────────────────────────────────────────────────
          PAGE HEADER (MATCHING IMAGE 2)
         ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#E5E5E5]">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-black">
            Treatment Catalog
          </h1>
          <p className="text-[13px] text-[#737373] mt-0.5">
            Browse, search, edit, or pin spa rituals and pricing packages.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="w-full sm:w-64 relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A3A3A3]" />
            <input
              type="text"
              placeholder="Search treatments..."
              value={menuSearch}
              onChange={e => setMenuSearch(e.target.value)}
              className="w-full bg-white border border-[#E5E5E5] rounded-lg pl-9 pr-3 py-2 text-xs text-black placeholder:text-[#A3A3A3] focus:outline-none focus:border-black transition-colors"
            />
          </div>

          <button 
            type="button"
            onClick={openAddModal}
            className="px-3.5 py-2 rounded-lg bg-black text-white hover:bg-neutral-800 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shadow-xs"
          >
            <PlusCircle size={15} />
            <span>Add Treatment</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          METRICS STRIP (MATCHING IMAGE 2)
         ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 border border-[#E5E5E5] rounded-xl divide-y sm:divide-y-0 sm:divide-x divide-[#E5E5E5] bg-white overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#737373]">
            Total Treatments
          </div>
          <div className="text-xl sm:text-2xl font-semibold tracking-tight text-black mt-1">
            {treatments.length}
          </div>
          <div className="text-[11px] text-[#737373] mt-0.5">In current catalog</div>
        </div>

        <div className="p-4 sm:p-5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#737373]">
            Pinned Most Booked
          </div>
          <div className="text-xl sm:text-2xl font-semibold tracking-tight text-black mt-1">
            {treatments.filter(t => t.is_pinned).length}
          </div>
          <div className="text-[11px] text-[#737373] mt-0.5">Featured on booking menu</div>
        </div>

        <div className="p-4 sm:p-5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#737373]">
            Categories
          </div>
          <div className="text-xl sm:text-2xl font-semibold tracking-tight text-black mt-1">
            {new Set(treatments.map(t => t.category)).size}
          </div>
          <div className="text-[11px] text-[#737373] mt-0.5">Unique ritual types</div>
        </div>

        <div className="p-4 sm:p-5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#737373]">
            Brand Scope
          </div>
          <div className="text-xl sm:text-2xl font-semibold tracking-tight text-black mt-1 flex items-center gap-1.5 capitalize">
            <span className="w-2.5 h-2.5 rounded-full bg-[#facc15]" />
            <span>Therapick</span>
          </div>
          <div className="text-[11px] text-[#737373] mt-0.5">Active catalogue</div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          GRID OF TREATMENTS (EXACTLY MATCHING IMAGE 2)
         ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTreatments.length === 0 ? (
          <div className="col-span-full bg-white border border-[#E5E5E5] rounded-xl p-12 text-center text-[#737373]">
            <Layers size={28} className="mx-auto mb-2 text-[#A3A3A3]" />
            <p className="font-semibold text-black">No treatments match your search</p>
            <p className="text-xs text-[#737373] mt-1">Try another keyword or create a new treatment.</p>
          </div>
        ) : (
          filteredTreatments.map(t => {
            const options = Array.isArray(t.options) ? t.options : [];

            return (
              <div 
                key={t.id} 
                className="bg-white border border-[#E5E5E5] rounded-xl p-5 shadow-xs hover:border-[#D4D4D4] transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <h4 className="font-semibold text-black text-sm uppercase pr-2">
                      {t.title}
                    </h4>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#F5F5F5] text-[#525252] border border-[#E5E5E5] capitalize shrink-0">
                      {t.category || 'Package'}
                    </span>
                  </div>
                  <p className="text-xs text-[#737373] line-clamp-2 mb-4 leading-relaxed">
                    {t.desc || 'Enjoy a relaxing wellness experience designed to soothe the body and mind.'}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="border border-[#E5E5E5] rounded-lg overflow-hidden bg-white">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#FAFAFA] border-b border-[#E5E5E5]">
                        <tr>
                          <th className="py-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-[#737373]">
                            Duration
                          </th>
                          <th className="py-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-[#737373] text-right">
                            Price (IDR)
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5E5E5]">
                        {options.map((o, idx) => {
                          const num = parseInt(String(o.price || '0').replace(/,/g, '') || '0', 10);
                          const formattedPrice = !isNaN(num) && num > 0 ? num.toLocaleString('en-US') : '0';

                          return (
                            <tr key={idx} className="hover:bg-[#FAFAFA] transition-colors">
                              <td className="py-2.5 px-3 font-medium text-black">
                                {o.duration} mins
                              </td>
                              <td className="py-2.5 px-3 font-semibold text-black text-right font-mono">
                                {formattedPrice}
                              </td>
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
                      className={`p-2 rounded-lg transition-colors shrink-0 cursor-pointer ${
                        t.is_pinned 
                          ? 'bg-black text-white shadow-xs' 
                          : 'bg-white border border-[#E5E5E5] text-black hover:bg-[#F5F5F5]'
                      }`}
                      title={t.is_pinned ? "Unpin from Most Booked" : "Pin to Most Booked"}
                    >
                      <Pin size={13} className={t.is_pinned ? "fill-white" : ""} />
                    </button>

                    {/* Thumbnail if pinned and available */}
                    {t.is_pinned && t.pinned_image && (
                      <img 
                        src={t.pinned_image} 
                        alt="Pinned" 
                        className="w-7 h-7 object-cover rounded-lg shrink-0 border border-[#E5E5E5]" 
                      />
                    )}

                    {/* Edit button */}
                    <button
                      type="button"
                      onClick={() => openEditModal(t)}
                      className="flex-1 py-1.5 px-3 rounded-lg border border-[#E5E5E5] bg-white hover:bg-[#F5F5F5] text-xs font-medium text-black flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Edit3 size={13} />
                      <span>Edit</span>
                    </button>

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => handleDelete(t)}
                      className="p-2 rounded-lg border border-[#E5E5E5] bg-white text-[#737373] hover:text-rose-600 hover:border-rose-200 transition-colors cursor-pointer"
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

      {/* ─────────────────────────────────────────────────────────────
          ADD / EDIT TREATMENT MODAL
         ───────────────────────────────────────────────────────────── */}
      {modalState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-xl rounded-xl shadow-2xl border border-[#E5E5E5] overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#E5E5E5] flex items-center justify-between bg-[#FAFAFA]">
              <div>
                <h2 className="text-base font-semibold text-black">
                  {modalState.isNew ? 'Add Spa Treatment' : 'Edit Treatment'}
                </h2>
                <p className="text-xs text-[#737373]">
                  {modalState.isNew ? 'Create a new massage or package for Therapick website.' : 'Update pricing tiers and description.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalState(prev => ({ ...prev, isOpen: false }))}
                className="p-1 rounded-lg text-[#737373] hover:text-black hover:bg-[#F5F5F5]"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveModal} className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="text-xs font-medium text-[#171717] mb-1.5 block">Treatment Title *</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. Traditional Balinese Massage" 
                  value={modalState.title} 
                  onChange={e => setModalState(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-white border border-[#E5E5E5] rounded-lg px-3 py-2 text-xs text-black placeholder:text-[#A3A3A3] focus:outline-none focus:border-black transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[#171717] mb-1.5 block">Category</label>
                  <select 
                    value={modalState.category} 
                    onChange={e => setModalState(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full bg-white border border-[#E5E5E5] rounded-lg px-3 py-2 text-xs text-black focus:outline-none focus:border-black transition-colors"
                  >
                    <option value="Massage">Massage</option>
                    <option value="Package">Package</option>
                    <option value="Facial">Facial</option>
                    <option value="Ritual">Ritual</option>
                    <option value="Body Scrub">Body Scrub</option>
                  </select>
                </div>

                <div className="flex items-center gap-4 pt-6">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[#171717]">
                    <input
                      type="checkbox"
                      checked={modalState.is_pinned}
                      onChange={e => setModalState(prev => ({ ...prev, is_pinned: e.target.checked }))}
                      className="w-4 h-4 rounded border-[#E5E5E5] text-black focus:ring-black"
                    />
                    <span>Most Booked Pin</span>
                  </label>
                </div>
              </div>

              {/* Duration & Pricing Options */}
              <div className="space-y-3 pt-2 border-t border-[#E5E5E5]">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-[#737373]">Duration & Pricing</h4>
                    <p className="text-[11px] text-[#A3A3A3] mt-0.5">Define duration options and prices in IDR</p>
                  </div>
                  <button 
                    type="button" 
                    onClick={handleAddOption}
                    className="text-xs font-medium text-black border border-[#E5E5E5] bg-white hover:bg-[#F5F5F5] px-2.5 py-1 rounded-md flex items-center gap-1 cursor-pointer"
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
                          className="w-full bg-white border border-[#E5E5E5] rounded-lg pl-3 pr-10 py-1.5 text-xs text-black focus:outline-none focus:border-black font-mono"
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-[#737373] pointer-events-none">
                          MINS
                        </span>
                      </div>

                      <div className="flex-1 relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-medium text-[#737373] pointer-events-none">
                          Rp
                        </span>
                        <input
                          type="text"
                          required
                          placeholder="450,000"
                          value={opt.price}
                          onChange={e => handleOptionChange(idx, 'price', e.target.value)}
                          className="w-full bg-white border border-[#E5E5E5] rounded-lg pl-8 pr-3 py-1.5 text-xs text-black focus:outline-none focus:border-black font-mono"
                        />
                      </div>

                      {modalState.options.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(idx)}
                          className="p-1.5 text-[#737373] hover:text-rose-600 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="pt-2 border-t border-[#E5E5E5]">
                <label className="text-xs font-medium text-[#171717] mb-1.5 block">Description</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Write details about the treatment, technique, and wellness effects..."
                  value={modalState.desc}
                  onChange={e => setModalState(prev => ({ ...prev, desc: e.target.value }))}
                  className="w-full bg-white border border-[#E5E5E5] rounded-lg px-3 py-2 text-xs text-black placeholder:text-[#A3A3A3] focus:outline-none focus:border-black transition-colors resize-none leading-relaxed"
                />
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-[#E5E5E5] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalState(prev => ({ ...prev, isOpen: false }))}
                  className="px-3.5 py-2 text-xs font-medium border border-[#E5E5E5] bg-white hover:bg-[#F5F5F5] rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-medium bg-black text-white hover:bg-neutral-800 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {isSubmitting ? <RefreshCw size={13} className="animate-spin text-[#facc15]" /> : <Check size={13} />}
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
