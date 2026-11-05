'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Building2, Plus, Edit2, Trash2, CheckCircle2, 
  MapPin, Clock, Tag, Image as ImageIcon, Upload, 
  X, ExternalLink, Sparkles, Phone, AlertCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useSpa, PartnerTreatment } from '@/context/SpaContext';

interface DurationOption {
  duration: string;
  price: string;
}

const CATEGORIES = ['Massage', 'Package', 'Facial', 'Body Scrub', 'Wellness', 'Hair Spa'];

export default function TherapickPartnerSpasView() {
  const { partnerTreatments: spaPartnerTreatments, setPartnerTreatments: setSpaPartnerTreatments } = useSpa();

  const [items, setItems] = useState<PartnerTreatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PartnerTreatment | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [form, setForm] = useState({
    partner_name: '',
    partner_location: '',
    partner_whatsapp: '',
    partner_logo_url: '',
    title: '',
    category: 'Massage',
    desc: '',
    image_url: '',
    order: 1,
    is_published: true,
    options: [
      { duration: '60', price: '450,000' },
      { duration: '90', price: '600,000' }
    ] as DurationOption[]
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const triggerRevalidation = async () => {
    try {
      await fetch('/api/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'revalidate' })
      });
    } catch (e) {
      console.warn('Revalidation notice:', e);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // FETCH PARTNER TREATMENTS (NO MOCK DATA)
  // ─────────────────────────────────────────────────────────────────────────────
  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('partner_treatments')
        .select('*')
        .eq('brand', 'therapick')
        .order('order', { ascending: true })
        .order('updated_at', { ascending: false });

      if (error) {
        // Table may not be migrated in Supabase yet
        console.warn('partner_treatments fetch notice:', error.message);
        if (spaPartnerTreatments && spaPartnerTreatments.length > 0) {
          setItems(spaPartnerTreatments);
        } else {
          setItems([]);
        }
      } else {
        const result = (data || []) as PartnerTreatment[];
        setItems(result);
        setSpaPartnerTreatments(result);
      }
    } catch (e) {
      console.error('Error fetching partner treatments:', e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [spaPartnerTreatments, setSpaPartnerTreatments]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // ─────────────────────────────────────────────────────────────────────────────
  // UPLOAD HELPERS
  // ─────────────────────────────────────────────────────────────────────────────
  const handleFileUpload = async (file: File, type: 'logo' | 'image') => {
    const isLogo = type === 'logo';
    if (isLogo) setIsUploadingLogo(true);
    else setIsUploadingImage(true);

    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const cleanName = file.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      const path = `partner-${type}s/${Date.now()}_${cleanName}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('campaign-images')
        .upload(path, file, {
          upsert: true,
          contentType: file.type || 'image/jpeg',
          cacheControl: '3600'
        });

      if (uploadError) {
        console.warn('Storage upload error, using local data URL fallback:', uploadError);
        // Fallback: Read as base64 data URL if storage bucket fails
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          if (isLogo) setForm(prev => ({ ...prev, partner_logo_url: result }));
          else setForm(prev => ({ ...prev, image_url: result }));
        };
        reader.readAsDataURL(file);
      } else {
        const { data: publicUrlData } = supabase.storage
          .from('campaign-images')
          .getPublicUrl(path);

        if (isLogo) {
          setForm(prev => ({ ...prev, partner_logo_url: publicUrlData.publicUrl }));
        } else {
          setForm(prev => ({ ...prev, image_url: publicUrlData.publicUrl }));
        }
      }
    } catch (err) {
      console.error('Upload exception:', err);
    } finally {
      if (isLogo) setIsUploadingLogo(false);
      else setIsUploadingImage(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // MODAL HANDLERS
  // ─────────────────────────────────────────────────────────────────────────────
  const openNewModal = () => {
    setEditingItem(null);
    setForm({
      partner_name: '',
      partner_location: 'Ubud, Bali',
      partner_whatsapp: '',
      partner_logo_url: '',
      title: '',
      category: 'Massage',
      desc: '',
      image_url: '',
      order: items.length + 1,
      is_published: true,
      options: [
        { duration: '60', price: '450,000' },
        { duration: '90', price: '600,000' }
      ]
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: PartnerTreatment) => {
    setEditingItem(item);
    setForm({
      partner_name: item.partner_name || '',
      partner_location: item.partner_location || '',
      partner_whatsapp: item.partner_whatsapp || '',
      partner_logo_url: item.partner_logo_url || '',
      title: item.title || '',
      category: item.category || 'Massage',
      desc: item.desc || '',
      image_url: item.image_url || '',
      order: item.order || 1,
      is_published: item.is_published !== false,
      options: (item.options && item.options.length > 0)
        ? item.options.map(o => ({ duration: o.duration, price: o.price }))
        : [
            { duration: '60', price: '450,000' },
            { duration: '90', price: '600,000' }
          ]
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.partner_name.trim() || !form.title.trim()) {
      alert('Please fill in Partner Spa Name and Treatment Title.');
      return;
    }

    setIsSubmitting(true);
    const targetId = editingItem?.id || (typeof crypto !== 'undefined' ? crypto.randomUUID() : `pt_${Date.now()}`);
    const nowIso = new Date().toISOString();

    const record: PartnerTreatment = {
      id: targetId,
      brand: 'therapick',
      partner_name: form.partner_name.trim(),
      partner_location: form.partner_location.trim(),
      partner_whatsapp: form.partner_whatsapp.trim() || null,
      partner_logo_url: form.partner_logo_url.trim() || null,
      partner_slug: form.partner_name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'),
      title: form.title.trim(),
      category: form.category,
      desc: form.desc.trim(),
      image_url: form.image_url.trim() || null,
      options: form.options.filter(o => o.duration && o.price),
      order: Number(form.order) || 1,
      is_published: form.is_published,
      updated_at: nowIso
    };

    let updatedList: PartnerTreatment[];
    if (editingItem) {
      updatedList = items.map(i => i.id === editingItem.id ? record : i);
    } else {
      updatedList = [...items, record];
    }

    // Sort by order ASC
    updatedList.sort((a, b) => (a.order || 999) - (b.order || 999));
    setItems(updatedList);
    setSpaPartnerTreatments(updatedList);
    setIsModalOpen(false);
    showToast(editingItem ? `Updated "${record.title}"` : `Added "${record.title}"`);

    try {
      if (editingItem) {
        await supabase.from('partner_treatments').update(record).eq('id', editingItem.id);
      } else {
        await supabase.from('partner_treatments').insert([record]);
      }
      await triggerRevalidation();
    } catch (err) {
      console.warn('Save partner treatment notice (make sure SQL migration has been run):', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Delete this partner treatment?')) return;

    const updated = items.filter(i => i.id !== id);
    setItems(updated);
    setSpaPartnerTreatments(updated);
    showToast('Partner treatment deleted');

    try {
      await supabase.from('partner_treatments').delete().eq('id', id);
      await triggerRevalidation();
    } catch (err) {
      console.warn('Delete partner treatment notice:', err);
    }
  };

  const handleTogglePublish = async (item: PartnerTreatment, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const nextStatus = item.is_published === false;
    const nowIso = new Date().toISOString();
    const updated = items.map(i => i.id === item.id ? { ...i, is_published: nextStatus, updated_at: nowIso } : i);
    setItems(updated);
    setSpaPartnerTreatments(updated);
    showToast(nextStatus ? `Published "${item.title}"` : `Hidden "${item.title}"`);

    try {
      await supabase.from('partner_treatments').update({ is_published: nextStatus, updated_at: nowIso }).eq('id', item.id);
      await triggerRevalidation();
    } catch (err) {
      console.warn('Toggle publish notice:', err);
    }
  };

  // Option row helpers
  const addOptionRow = () => {
    setForm(prev => ({
      ...prev,
      options: [...prev.options, { duration: '90', price: '650,000' }]
    }));
  };

  const removeOptionRow = (index: number) => {
    setForm(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  const updateOptionRow = (index: number, field: 'duration' | 'price', val: string) => {
    setForm(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => i === index ? { ...opt, [field]: val } : opt)
    }));
  };

  return (
    <div className="space-y-6">

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[var(--fitlo-ink)] text-[var(--fitlo-card)] text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl border border-[var(--fitlo-line)] flex items-center gap-2.5 animate-in slide-in-from-bottom-3">
          <CheckCircle2 size={16} className="text-[var(--fitlo-accent)]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ─── FITLO PAGE HEADER ─── */}
      <div className="fitlo-page-head">
        <div>
          <h1 className="fitlo-page-title">Partner Spas &amp; Treatments</h1>
          <p className="fitlo-page-sub">
            Real spa partner treatments that customers can browse and book directly on booktherapick.com.
          </p>
        </div>

        <button
          type="button"
          onClick={openNewModal}
          className="fitlo-btn fitlo-btn--primary"
        >
          <Plus size={16} />
          <span>Add partner treatment</span>
        </button>
      </div>

      {/* ─── CONTENT SECTION ─── */}
      {loading ? (
        <div className="card p-12 text-center text-sm text-[var(--fitlo-muted)] animate-pulse">
          Loading partner spa treatments...
        </div>
      ) : items.length === 0 ? (
        <div className="card p-12 text-center max-w-xl mx-auto space-y-4 border-dashed border-2">
          <div className="w-14 h-14 rounded-2xl bg-[color-mix(in_srgb,var(--fitlo-accent)_12%,transparent)] text-[var(--fitlo-accent)] flex items-center justify-center mx-auto">
            <Building2 size={28} />
          </div>
          <div>
            <h3 className="text-base font-bold text-[var(--fitlo-ink)]">No partner treatments added yet</h3>
            <p className="text-xs text-[var(--fitlo-muted)] mt-1.5 max-w-md mx-auto leading-relaxed">
              When you partner with a real Bali spa, add their treatments here with their logo and photos. They will automatically be listed on the main website right below the Popular Category section.
            </p>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={openNewModal}
              className="fitlo-btn fitlo-btn--primary mx-auto"
            >
              <Plus size={16} />
              <span>Add your first partner treatment</span>
            </button>
          </div>
          <div className="pt-4 border-t border-[var(--fitlo-line)] text-[11px] text-[var(--fitlo-muted)]">
            Note: If you have not run the database migration yet, execute <code>supabase_partner_treatments_schema.sql</code> in your Supabase SQL editor.
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item) => {
            const isLive = item.is_published !== false;
            const lowestPrice = item.options && item.options.length > 0 ? item.options[0].price : null;

            return (
              <div 
                key={item.id} 
                className={`card p-5 space-y-4 transition-all hover:shadow-md flex flex-col justify-between ${isLive ? '' : 'opacity-60 bg-[var(--fitlo-card)]/50'}`}
              >
                <div className="space-y-3.5">
                  {/* Partner Header Strip */}
                  <div className="flex items-center justify-between gap-3 pb-3 border-b border-[var(--fitlo-line)]">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {item.partner_logo_url ? (
                        <img 
                          src={item.partner_logo_url} 
                          alt={item.partner_name}
                          className="w-8 h-8 rounded-full object-cover border border-[var(--fitlo-line)] shrink-0 bg-white" 
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-[var(--fitlo-line)] text-[var(--fitlo-ink)] flex items-center justify-center text-xs font-black shrink-0">
                          {item.partner_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-[var(--fitlo-ink)] truncate leading-tight">
                          {item.partner_name}
                        </h4>
                        {item.partner_location && (
                          <div className="flex items-center gap-1 text-[11px] text-[var(--fitlo-muted)] mt-0.5 truncate">
                            <MapPin size={11} className="shrink-0" />
                            <span className="truncate">{item.partner_location}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status Pill */}
                    <button
                      type="button"
                      onClick={(e) => handleTogglePublish(item, e)}
                      title={isLive ? 'Click to hide from website' : 'Click to publish on website'}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-colors shrink-0 ${
                        isLive 
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' 
                          : 'bg-neutral-500/10 text-neutral-500 border-neutral-500/20'
                      }`}
                    >
                      {isLive ? '● Live' : '○ Draft'}
                    </button>
                  </div>

                  {/* Treatment Image (if available) */}
                  {item.image_url && (
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-[var(--fitlo-line)]">
                      <img 
                        src={item.image_url} 
                        alt={item.title}
                        className="w-full h-full object-cover" 
                      />
                      <span className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {item.category}
                      </span>
                    </div>
                  )}

                  {/* Treatment Info */}
                  <div>
                    {!item.image_url && (
                      <span className="inline-block text-[10px] font-bold text-[var(--fitlo-muted)] uppercase tracking-wider mb-1">
                        {item.category}
                      </span>
                    )}
                    <h3 className="text-sm font-bold text-[var(--fitlo-ink)] leading-snug">
                      {item.title}
                    </h3>
                    {item.desc && (
                      <p className="text-xs text-[var(--fitlo-muted)] mt-1 line-clamp-2 leading-relaxed">
                        {item.desc}
                      </p>
                    )}
                  </div>

                  {/* Options List */}
                  {item.options && item.options.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {item.options.map((opt, idx) => (
                        <span 
                          key={idx}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--fitlo-line)]/50 text-[11px] font-semibold text-[var(--fitlo-ink)]"
                        >
                          <Clock size={11} className="text-[var(--fitlo-muted)]" />
                          <span>{opt.duration} Min · IDR {opt.price}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer Action Row */}
                <div className="pt-3 border-t border-[var(--fitlo-line)] flex items-center justify-between gap-2">
                  <div className="text-[11px] text-[var(--fitlo-muted)] font-medium">
                    {lowestPrice ? `Starts IDR ${lowestPrice}` : 'No pricing set'}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEditModal(item)}
                      className="p-1.5 rounded-lg text-[var(--fitlo-muted)] hover:text-[var(--fitlo-ink)] hover:bg-[var(--fitlo-line)]/50 transition-colors"
                      title="Edit partner treatment"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(item.id, e)}
                      className="p-1.5 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-500/10 transition-colors"
                      title="Delete partner treatment"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          MODAL: ADD / EDIT PARTNER TREATMENT
          ───────────────────────────────────────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fitlo-modal-backdrop flex items-center justify-center p-4">
          <div className="fitlo-modal w-full max-w-xl animate-in zoom-in-95 max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 pb-4 border-b border-[var(--fitlo-line)] shrink-0">
              <div>
                <h3 className="text-base font-bold text-[var(--fitlo-ink)]">
                  {editingItem ? 'Edit partner treatment' : 'New partner spa treatment'}
                </h3>
                <p className="text-xs text-[var(--fitlo-muted)] mt-0.5">
                  Displays on booktherapick.com homepage under Popular Categories.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-[var(--fitlo-muted)] hover:text-[var(--fitlo-ink)]"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="flex flex-col flex-1 min-h-0">
              <div className="overflow-y-auto flex-1 p-6 pt-4 space-y-4">
                
                {/* ── Partner Info ────────────────────────── */}
                <div className="space-y-3 pb-3 border-b border-[var(--fitlo-line)]">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--fitlo-accent)]">
                    1. Spa Partner Details
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[var(--fitlo-ink)] mb-1">
                        Partner Spa Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Jaens Spa Ubud"
                        value={form.partner_name}
                        onChange={e => setForm({ ...form, partner_name: e.target.value })}
                        className="fitlo-input w-full text-xs font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[var(--fitlo-ink)] mb-1">
                        Spa Location *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Jl. Raya Pengosekan, Ubud"
                        value={form.partner_location}
                        onChange={e => setForm({ ...form, partner_location: e.target.value })}
                        className="fitlo-input w-full text-xs"
                      />
                    </div>
                  </div>

                  {/* Partner Logo Upload & URL */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--fitlo-ink)] mb-1">
                      Partner Company Logo
                    </label>
                    <div className="flex items-center gap-3">
                      {form.partner_logo_url && (
                        <img 
                          src={form.partner_logo_url} 
                          alt="Logo Preview" 
                          className="w-10 h-10 rounded-full object-cover border border-[var(--fitlo-line)] shrink-0 bg-white" 
                        />
                      )}
                      <label className="fitlo-btn fitlo-btn--ghost text-xs cursor-pointer shrink-0">
                        <Upload size={14} />
                        <span>{isUploadingLogo ? 'Uploading...' : 'Upload Logo'}</span>
                        <input 
                          type="file" 
                          accept="image/*"
                          className="hidden" 
                          onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'logo')}
                        />
                      </label>
                      <input
                        type="url"
                        placeholder="Or paste logo URL (https://...)"
                        value={form.partner_logo_url}
                        onChange={e => setForm({ ...form, partner_logo_url: e.target.value })}
                        className="fitlo-input flex-1 text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* ── Treatment Details ────────────────────────── */}
                <div className="space-y-3 pb-3 border-b border-[var(--fitlo-line)]">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--fitlo-accent)]">
                    2. Treatment Information
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-[var(--fitlo-ink)] mb-1">
                        Treatment Title *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Traditional Balinese Body Scrub & Floral Bath"
                        value={form.title}
                        onChange={e => setForm({ ...form, title: e.target.value })}
                        className="fitlo-input w-full text-xs font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[var(--fitlo-ink)] mb-1">
                        Category
                      </label>
                      <select
                        value={form.category}
                        onChange={e => setForm({ ...form, category: e.target.value })}
                        className="fitlo-select w-full text-xs"
                      >
                        {CATEGORIES.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--fitlo-ink)] mb-1">
                      Description / Highlights
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Luxurious signature ritual performed in private garden gazebo at partner spa..."
                      value={form.desc}
                      onChange={e => setForm({ ...form, desc: e.target.value })}
                      className="fitlo-input w-full text-xs resize-none"
                    />
                  </div>

                  {/* Treatment Photo Upload & URL */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--fitlo-ink)] mb-1">
                      Treatment Photo Image
                    </label>
                    <div className="flex items-center gap-3">
                      {form.image_url && (
                        <img 
                          src={form.image_url} 
                          alt="Photo Preview" 
                          className="w-14 h-10 rounded-lg object-cover border border-[var(--fitlo-line)] shrink-0 bg-white" 
                        />
                      )}
                      <label className="fitlo-btn fitlo-btn--ghost text-xs cursor-pointer shrink-0">
                        <Upload size={14} />
                        <span>{isUploadingImage ? 'Uploading...' : 'Upload Image'}</span>
                        <input 
                          type="file" 
                          accept="image/*"
                          className="hidden" 
                          onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'image')}
                        />
                      </label>
                      <input
                        type="url"
                        placeholder="Or paste photo URL (https://...)"
                        value={form.image_url}
                        onChange={e => setForm({ ...form, image_url: e.target.value })}
                        className="fitlo-input flex-1 text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* ── Durations & Pricing ────────────────────────── */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--fitlo-accent)]">
                        3. Duration &amp; Pricing
                      </span>
                      <p className="text-[11px] text-[var(--fitlo-muted)] mt-0.5">
                        Define available durations and customer prices in IDR.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={addOptionRow}
                      className="text-xs font-semibold text-[var(--fitlo-accent)] hover:underline flex items-center gap-1"
                    >
                      <Plus size={14} />
                      <span>Add option</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {form.options.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="w-28 shrink-0">
                          <input
                            type="text"
                            placeholder="60"
                            value={opt.duration}
                            onChange={e => updateOptionRow(idx, 'duration', e.target.value)}
                            className="fitlo-input w-full text-xs font-semibold"
                          />
                        </div>
                        <span className="text-xs text-[var(--fitlo-muted)] shrink-0">Mins · IDR</span>
                        <div className="flex-1">
                          <input
                            type="text"
                            placeholder="450,000"
                            value={opt.price}
                            onChange={e => updateOptionRow(idx, 'price', e.target.value)}
                            className="fitlo-input w-full text-xs font-semibold"
                          />
                        </div>
                        {form.options.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeOptionRow(idx)}
                            className="p-1.5 text-red-500 hover:text-red-600 rounded-lg"
                            title="Remove option"
                          >
                            <X size={15} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Publication Status ────────────────────────── */}
                <div className="flex items-center justify-between pt-3 border-t border-[var(--fitlo-line)]">
                  <div>
                    <span className="text-xs font-bold text-[var(--fitlo-ink)]">Publish immediately</span>
                    <p className="text-[11px] text-[var(--fitlo-muted)]">Show live under Popular Categories on the website.</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={form.is_published}
                    onClick={() => setForm({ ...form, is_published: !form.is_published })}
                    className={`fitlo-switch ${form.is_published ? 'is-checked' : ''}`}
                  >
                    <i />
                  </button>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="p-6 pt-4 border-t border-[var(--fitlo-line)] shrink-0 flex items-center justify-between">
                {editingItem?.id ? (
                  <button
                    type="button"
                    onClick={(e) => { handleDelete(editingItem.id, e); setIsModalOpen(false); }}
                    className="text-xs font-semibold text-red-500 hover:underline"
                  >
                    Delete treatment
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="fitlo-btn fitlo-btn--ghost text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="fitlo-btn fitlo-btn--primary text-xs"
                  >
                    <span>{isSubmitting ? 'Saving...' : editingItem ? 'Save changes' : 'Save treatment'}</span>
                  </button>
                </div>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}

