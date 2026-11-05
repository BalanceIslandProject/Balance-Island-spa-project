'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Building2, Plus, Edit2, Trash2, CheckCircle2, 
  MapPin, Clock, Tag, Image as ImageIcon, Upload, 
  X, ExternalLink, Sparkles, Phone, Percent, Receipt,
  ChevronDown, Filter, Eye, Layers, AlertCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useSpa, SpaPartner, PartnerTreatment } from '@/context/SpaContext';

interface DurationOption {
  duration: string;
  price: string;
}

const CATEGORIES = ['Massage', 'Package', 'Facial', 'Body Scrub', 'Wellness', 'Hair Spa'];

export default function TherapickPartnerSpasView() {
  const { 
    spaPartners: contextPartners, setSpaPartners: setContextPartners,
    partnerTreatments: contextTreatments, setPartnerTreatments: setContextTreatments 
  } = useSpa();

  // Active Sub-Tab: 'partners' (Profiles) | 'treatments' (Treatments under Partners)
  const [activeSubTab, setActiveSubTab] = useState<'partners' | 'treatments'>('partners');
  const [selectedPartnerFilter, setSelectedPartnerFilter] = useState<string>('all');

  const [partners, setPartners] = useState<SpaPartner[]>([]);
  const [treatments, setTreatments] = useState<PartnerTreatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // ── Partner Profile Modal State ──
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<SpaPartner | null>(null);
  const [isUploadingPartnerLogo, setIsUploadingPartnerLogo] = useState(false);
  const [partnerForm, setPartnerForm] = useState({
    name: '',
    location: '',
    whatsapp: '',
    logo_url: '',
    discount_percentage: 0,
    tax_percentage: 0,
    description: '',
    is_active: true,
    order: 1
  });

  // ── Treatment Modal State ──
  const [isTreatmentModalOpen, setIsTreatmentModalOpen] = useState(false);
  const [editingTreatment, setEditingTreatment] = useState<PartnerTreatment | null>(null);
  const [isUploadingTreatmentImage, setIsUploadingTreatmentImage] = useState(false);
  const [treatmentForm, setTreatmentForm] = useState({
    partner_id: '',
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

  const [isSubmitting, setIsSubmitting] = useState(false);

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
  // FETCH ALL DATA (SAFE, NO ENDLESS LOOPS, WITH TIMEOUT)
  // ─────────────────────────────────────────────────────────────────────────────
  const loadAllData = useCallback(async () => {
    setLoading(true);

    // Timeout safety fallback: never stay stuck in loading forever
    const timer = setTimeout(() => {
      setLoading(false);
    }, 4000);

    try {
      const [partnersRes, treatmentsRes] = await Promise.all([
        supabase
          .from('spa_partners')
          .select('*')
          .eq('brand', 'therapick')
          .order('order', { ascending: true })
          .order('created_at', { ascending: false }),
        supabase
          .from('partner_treatments')
          .select('*')
          .eq('brand', 'therapick')
          .order('order', { ascending: true })
          .order('created_at', { ascending: false })
      ]);

      clearTimeout(timer);

      if (partnersRes.data) {
        setPartners(partnersRes.data as SpaPartner[]);
        setContextPartners(partnersRes.data as SpaPartner[]);
      } else {
        setPartners([]);
      }

      if (treatmentsRes.data) {
        setTreatments(treatmentsRes.data as PartnerTreatment[]);
        setContextTreatments(treatmentsRes.data as PartnerTreatment[]);
      } else {
        setTreatments([]);
      }
    } catch (err) {
      console.warn('Notice loading partner spa data:', err);
      clearTimeout(timer);
    } finally {
      setLoading(false);
    }
  }, []); // Safe empty dependency array

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // ─────────────────────────────────────────────────────────────────────────────
  // UPLOAD HELPERS (STORAGE: campaign-images BUCKET)
  // ─────────────────────────────────────────────────────────────────────────────
  const handleFileUpload = async (file: File, target: 'partner-logo' | 'treatment-image') => {
    const isLogo = target === 'partner-logo';
    if (isLogo) setIsUploadingPartnerLogo(true);
    else setIsUploadingTreatmentImage(true);

    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const folder = isLogo ? 'partner-logos' : 'partner-treatments';
      const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('campaign-images')
        .upload(fileName, file, { cacheControl: '3600', upsert: true });

      if (uploadError) {
        // Fallback: local FileReader data URL
        const reader = new FileReader();
        reader.onloadend = () => {
          const res = reader.result as string;
          if (isLogo) setPartnerForm(prev => ({ ...prev, logo_url: res }));
          else setTreatmentForm(prev => ({ ...prev, image_url: res }));
          showToast('Image loaded via local preview (storage notice)');
        };
        reader.readAsDataURL(file);
      } else {
        const { data: publicData } = supabase.storage
          .from('campaign-images')
          .getPublicUrl(fileName);

        if (publicData?.publicUrl) {
          if (isLogo) setPartnerForm(prev => ({ ...prev, logo_url: publicData.publicUrl }));
          else setTreatmentForm(prev => ({ ...prev, image_url: publicData.publicUrl }));
          showToast('Image uploaded successfully');
        }
      }
    } catch (err) {
      console.error('File upload error:', err);
      showToast('Upload error occurred');
    } finally {
      if (isLogo) setIsUploadingPartnerLogo(false);
      else setIsUploadingTreatmentImage(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // PARTNER PROFILE ACTIONS
  // ─────────────────────────────────────────────────────────────────────────────
  const openNewPartnerModal = () => {
    setEditingPartner(null);
    setPartnerForm({
      name: '',
      location: '',
      whatsapp: '',
      logo_url: '',
      discount_percentage: 0,
      tax_percentage: 0,
      description: '',
      is_active: true,
      order: (partners.length || 0) + 1
    });
    setIsPartnerModalOpen(true);
  };

  const openEditPartnerModal = (partner: SpaPartner, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingPartner(partner);
    setPartnerForm({
      name: partner.name || '',
      location: partner.location || '',
      whatsapp: partner.whatsapp || '',
      logo_url: partner.logo_url || '',
      discount_percentage: Number(partner.discount_percentage) || 0,
      tax_percentage: Number(partner.tax_percentage) || 0,
      description: partner.description || '',
      is_active: partner.is_active !== false,
      order: partner.order || 1
    });
    setIsPartnerModalOpen(true);
  };

  const handleSavePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerForm.name.trim()) {
      alert('Please enter a Partner Spa Name.');
      return;
    }

    setIsSubmitting(true);
    const targetId = editingPartner?.id || (typeof crypto !== 'undefined' ? crypto.randomUUID() : `sp_${Date.now()}`);
    const nowIso = new Date().toISOString();

    const record: SpaPartner = {
      id: targetId,
      brand: 'therapick',
      name: partnerForm.name.trim(),
      slug: partnerForm.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'),
      location: partnerForm.location.trim() || null,
      whatsapp: partnerForm.whatsapp.trim() || null,
      logo_url: partnerForm.logo_url.trim() || null,
      discount_percentage: Number(partnerForm.discount_percentage) || 0,
      tax_percentage: Number(partnerForm.tax_percentage) || 0,
      description: partnerForm.description.trim() || null,
      is_active: partnerForm.is_active,
      order: Number(partnerForm.order) || 1,
      updated_at: nowIso
    };

    let updatedList: SpaPartner[];
    if (editingPartner) {
      updatedList = partners.map(p => p.id === editingPartner.id ? record : p);
    } else {
      updatedList = [...partners, record];
    }
    updatedList.sort((a, b) => (a.order || 999) - (b.order || 999));

    setPartners(updatedList);
    setContextPartners(updatedList);
    setIsPartnerModalOpen(false);
    showToast(editingPartner ? `Updated partner "${record.name}"` : `Added partner profile "${record.name}"`);

    try {
      if (editingPartner) {
        await supabase.from('spa_partners').update(record).eq('id', editingPartner.id);
        // Also sync denormalized partner fields on all child treatments
        await supabase.from('partner_treatments').update({
          partner_name: record.name,
          partner_location: record.location,
          partner_logo_url: record.logo_url,
          partner_whatsapp: record.whatsapp,
          partner_discount_percentage: record.discount_percentage,
          partner_tax_percentage: record.tax_percentage,
          updated_at: nowIso
        }).eq('partner_id', editingPartner.id);

        // Update local treatments state as well
        setTreatments(prev => prev.map(t => t.partner_id === editingPartner.id ? {
          ...t,
          partner_name: record.name,
          partner_location: record.location,
          partner_logo_url: record.logo_url,
          partner_whatsapp: record.whatsapp,
          partner_discount_percentage: record.discount_percentage,
          partner_tax_percentage: record.tax_percentage
        } : t));
      } else {
        await supabase.from('spa_partners').insert([record]);
      }
      await triggerRevalidation();
    } catch (err) {
      console.warn('Notice saving partner profile:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePartner = async (partner: SpaPartner, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const childCount = treatments.filter(t => t.partner_id === partner.id).length;
    const confirmMsg = childCount > 0 
      ? `Delete "${partner.name}" and all ${childCount} treatments under this partner?`
      : `Delete partner profile "${partner.name}"?`;

    if (!confirm(confirmMsg)) return;

    const nextPartners = partners.filter(p => p.id !== partner.id);
    const nextTreatments = treatments.filter(t => t.partner_id !== partner.id);

    setPartners(nextPartners);
    setContextPartners(nextPartners);
    setTreatments(nextTreatments);
    setContextTreatments(nextTreatments);
    showToast(`Deleted partner "${partner.name}"`);

    try {
      await supabase.from('spa_partners').delete().eq('id', partner.id);
      await supabase.from('partner_treatments').delete().eq('partner_id', partner.id);
      await triggerRevalidation();
    } catch (err) {
      console.warn('Notice deleting partner profile:', err);
    }
  };

  const togglePartnerActive = async (partner: SpaPartner, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const nextStatus = !partner.is_active;
    const updated = partners.map(p => p.id === partner.id ? { ...p, is_active: nextStatus } : p);
    setPartners(updated);
    setContextPartners(updated);
    showToast(`Partner is now ${nextStatus ? 'active' : 'inactive'}`);

    try {
      await supabase.from('spa_partners').update({ is_active: nextStatus, updated_at: new Date().toISOString() }).eq('id', partner.id);
      await triggerRevalidation();
    } catch (err) {
      console.warn('Notice toggling partner status:', err);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // TREATMENT ACTIONS
  // ─────────────────────────────────────────────────────────────────────────────
  const openNewTreatmentModal = (preselectedPartnerId?: string) => {
    if (partners.length === 0) {
      alert('Please create at least one Partner Profile before adding treatments.');
      openNewPartnerModal();
      return;
    }

    const defaultPartner = preselectedPartnerId 
      ? partners.find(p => p.id === preselectedPartnerId) || partners[0]
      : (selectedPartnerFilter !== 'all' ? partners.find(p => p.id === selectedPartnerFilter) || partners[0] : partners[0]);

    setEditingTreatment(null);
    setTreatmentForm({
      partner_id: defaultPartner?.id || partners[0]?.id || '',
      title: '',
      category: 'Massage',
      desc: '',
      image_url: '',
      order: (treatments.length || 0) + 1,
      is_published: true,
      options: [
        { duration: '60', price: '450,000' },
        { duration: '90', price: '600,000' }
      ]
    });
    setIsTreatmentModalOpen(true);
  };

  const openEditTreatmentModal = (item: PartnerTreatment, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingTreatment(item);
    setTreatmentForm({
      partner_id: item.partner_id || partners.find(p => p.name === item.partner_name)?.id || partners[0]?.id || '',
      title: item.title,
      category: item.category || 'Massage',
      desc: item.desc || '',
      image_url: item.image_url || '',
      order: item.order || 1,
      is_published: item.is_published !== false,
      options: item.options && item.options.length > 0
        ? item.options.map(o => ({ duration: o.duration, price: o.price }))
        : [{ duration: '60', price: '450,000' }]
    });
    setIsTreatmentModalOpen(true);
  };

  const handleSaveTreatment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!treatmentForm.partner_id) {
      alert('Please select a Partner Profile for this treatment.');
      return;
    }
    if (!treatmentForm.title.trim()) {
      alert('Please enter a Treatment Title.');
      return;
    }

    const selectedPartner = partners.find(p => p.id === treatmentForm.partner_id);
    if (!selectedPartner) {
      alert('Selected partner profile could not be found.');
      return;
    }

    setIsSubmitting(true);
    const targetId = editingTreatment?.id || (typeof crypto !== 'undefined' ? crypto.randomUUID() : `pt_${Date.now()}`);
    const nowIso = new Date().toISOString();

    const record: PartnerTreatment = {
      id: targetId,
      brand: 'therapick',
      partner_id: selectedPartner.id,
      partner_name: selectedPartner.name,
      partner_location: selectedPartner.location || null,
      partner_whatsapp: selectedPartner.whatsapp || null,
      partner_logo_url: selectedPartner.logo_url || null,
      partner_slug: selectedPartner.slug || selectedPartner.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'),
      partner_discount_percentage: Number(selectedPartner.discount_percentage) || 0,
      partner_tax_percentage: Number(selectedPartner.tax_percentage) || 0,
      title: treatmentForm.title.trim(),
      category: treatmentForm.category,
      desc: treatmentForm.desc.trim() || null,
      image_url: treatmentForm.image_url.trim() || null,
      options: treatmentForm.options.filter(o => o.duration && o.price),
      order: Number(treatmentForm.order) || 1,
      is_published: treatmentForm.is_published,
      updated_at: nowIso
    };

    let updatedList: PartnerTreatment[];
    if (editingTreatment) {
      updatedList = treatments.map(t => t.id === editingTreatment.id ? record : t);
    } else {
      updatedList = [...treatments, record];
    }
    updatedList.sort((a, b) => (a.order || 999) - (b.order || 999));

    setTreatments(updatedList);
    setContextTreatments(updatedList);
    setIsTreatmentModalOpen(false);
    showToast(editingTreatment ? `Updated "${record.title}"` : `Added "${record.title}"`);

    try {
      if (editingTreatment) {
        await supabase.from('partner_treatments').update(record).eq('id', editingTreatment.id);
      } else {
        await supabase.from('partner_treatments').insert([record]);
      }
      await triggerRevalidation();
    } catch (err) {
      console.warn('Notice saving treatment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTreatment = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm('Are you sure you want to delete this partner treatment?')) return;

    const nextList = treatments.filter(t => t.id !== id);
    setTreatments(nextList);
    setContextTreatments(nextList);
    showToast('Treatment deleted');

    try {
      await supabase.from('partner_treatments').delete().eq('id', id);
      await triggerRevalidation();
    } catch (err) {
      console.warn('Notice deleting treatment:', err);
    }
  };

  const toggleTreatmentPublish = async (item: PartnerTreatment, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const nextStatus = !item.is_published;
    const updated = treatments.map(t => t.id === item.id ? { ...t, is_published: nextStatus } : t);
    setTreatments(updated);
    setContextTreatments(updated);
    showToast(`Treatment is now ${nextStatus ? 'published' : 'draft'}`);

    try {
      await supabase.from('partner_treatments').update({ is_published: nextStatus, updated_at: new Date().toISOString() }).eq('id', item.id);
      await triggerRevalidation();
    } catch (err) {
      console.warn('Notice toggling publish status:', err);
    }
  };

  // Option row helpers
  const addOptionRow = () => {
    setTreatmentForm(prev => ({
      ...prev,
      options: [...prev.options, { duration: '120', price: '750,000' }]
    }));
  };

  const removeOptionRow = (index: number) => {
    setTreatmentForm(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  const updateOptionRow = (index: number, field: 'duration' | 'price', val: string) => {
    setTreatmentForm(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => i === index ? { ...opt, [field]: val } : opt)
    }));
  };

  // Filtered treatments list
  const filteredTreatments = useMemo(() => {
    if (selectedPartnerFilter === 'all') return treatments;
    return treatments.filter(t => t.partner_id === selectedPartnerFilter || t.partner_name === partners.find(p => p.id === selectedPartnerFilter)?.name);
  }, [treatments, selectedPartnerFilter, partners]);

  // Current selected partner for live price calculation in treatment modal
  const modalSelectedPartner = useMemo(() => {
    return partners.find(p => p.id === treatmentForm.partner_id) || null;
  }, [partners, treatmentForm.partner_id]);

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
            Create real partner spa profiles with custom discount and tax rates, then manage their treatments.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {activeSubTab === 'partners' ? (
            <button
              type="button"
              onClick={openNewPartnerModal}
              className="fitlo-btn fitlo-btn--primary"
            >
              <Plus size={16} />
              <span>Create Partner Profile</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={openNewPartnerModal}
                className="fitlo-btn fitlo-btn--secondary text-xs"
              >
                <Building2 size={14} />
                <span>+ Partner Profile</span>
              </button>
              <button
                type="button"
                onClick={() => openNewTreatmentModal()}
                className="fitlo-btn fitlo-btn--primary"
              >
                <Plus size={16} />
                <span>Add Treatment</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ─── TWO-TIER NAVIGATION SUB-TABS (FITLO PILL TABS) ─── */}
      <div className="flex items-center justify-between border-b border-[var(--fitlo-line)] pb-2 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('partners')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'partners'
                ? 'bg-[var(--fitlo-ink)] text-[var(--fitlo-card)] shadow-xs'
                : 'bg-[var(--fitlo-surface)] text-[var(--fitlo-muted)] hover:text-[var(--fitlo-ink)]'
            }`}
          >
            <Building2 size={14} />
            <span>Partner Profiles</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${
              activeSubTab === 'partners' ? 'bg-white/20 text-white' : 'bg-[var(--fitlo-line)] text-[var(--fitlo-ink)]'
            }`}>
              {partners.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('treatments')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'treatments'
                ? 'bg-[var(--fitlo-ink)] text-[var(--fitlo-card)] shadow-xs'
                : 'bg-[var(--fitlo-surface)] text-[var(--fitlo-muted)] hover:text-[var(--fitlo-ink)]'
            }`}
          >
            <Layers size={14} />
            <span>Treatments</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${
              activeSubTab === 'treatments' ? 'bg-white/20 text-white' : 'bg-[var(--fitlo-line)] text-[var(--fitlo-ink)]'
            }`}>
              {treatments.length}
            </span>
          </button>
        </div>

        {/* Treatment Filter by Partner */}
        {activeSubTab === 'treatments' && partners.length > 0 && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[var(--fitlo-muted)] font-medium flex items-center gap-1">
              <Filter size={12} />
              Partner:
            </span>
            <select
              value={selectedPartnerFilter}
              onChange={(e) => setSelectedPartnerFilter(e.target.value)}
              className="fitlo-select text-xs py-1 px-2.5 h-8 font-semibold"
            >
              <option value="all">All Partners ({treatments.length})</option>
              {partners.map(p => {
                const count = treatments.filter(t => t.partner_id === p.id || t.partner_name === p.name).length;
                return (
                  <option key={p.id} value={p.id}>
                    {p.name} ({count})
                  </option>
                );
              })}
            </select>
          </div>
        )}
      </div>

      {/* ─── LOADING STATE ─── */}
      {loading ? (
        <div className="card p-12 text-center text-sm text-[var(--fitlo-muted)]">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--fitlo-accent)] border-t-transparent animate-spin mx-auto mb-3"></div>
          <span>Loading partner profiles and treatments...</span>
        </div>
      ) : activeSubTab === 'partners' ? (

        /* ─────────────────────────────────────────────────────────────────────────────
           TAB 1: PARTNER PROFILES LIST
           ───────────────────────────────────────────────────────────────────────────── */
        partners.length === 0 ? (
          <div className="card p-12 text-center max-w-xl mx-auto space-y-4 border-dashed border-2">
            <div className="w-14 h-14 rounded-2xl bg-[color-mix(in_srgb,var(--fitlo-accent)_12%,transparent)] text-[var(--fitlo-accent)] flex items-center justify-center mx-auto">
              <Building2 size={28} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--fitlo-ink)]">No Partner Profiles Created Yet</h3>
              <p className="text-xs text-[var(--fitlo-muted)] mt-1.5 max-w-md mx-auto leading-relaxed">
                Start by creating your first Partner Spa Profile. You can set their company logo, address, custom discount rate (e.g. 10%), and tax rate (e.g. 11%), then add treatments under their profile.
              </p>
            </div>
            <button
              type="button"
              onClick={openNewPartnerModal}
              className="fitlo-btn fitlo-btn--primary mx-auto"
            >
              <Plus size={16} />
              <span>Create First Partner Profile</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {partners.map((partner) => {
              const partnerTreatmentsCount = treatments.filter(t => t.partner_id === partner.id || t.partner_name === partner.name).length;
              const discountNum = Number(partner.discount_percentage) || 0;
              const taxNum = Number(partner.tax_percentage) || 0;

              return (
                <div
                  key={partner.id}
                  className="card p-5 flex flex-col justify-between hover:border-[var(--fitlo-accent)] transition-all relative group"
                >
                  <div className="space-y-4">
                    {/* Header Row: Logo & Status */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {partner.logo_url ? (
                          <img
                            src={partner.logo_url}
                            alt={partner.name}
                            className="w-12 h-12 rounded-2xl object-cover border border-[var(--fitlo-line)] bg-white shrink-0 shadow-xs"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-2xl bg-[color-mix(in_srgb,var(--fitlo-accent)_15%,transparent)] text-[var(--fitlo-accent)] flex items-center justify-center font-bold text-lg shrink-0">
                            {partner.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <h3 className="font-bold text-sm text-[var(--fitlo-ink)] leading-snug">
                            {partner.name}
                          </h3>
                          {partner.location && (
                            <span className="text-[11px] text-[var(--fitlo-muted)] flex items-center gap-1 mt-0.5">
                              <MapPin size={11} className="text-[var(--fitlo-muted)]" />
                              {partner.location}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Active Status Badge */}
                      <button
                        type="button"
                        onClick={(e) => togglePartnerActive(partner, e)}
                        className={`fitlo-badge text-[10px] font-bold cursor-pointer ${
                          partner.is_active ? 'fitlo-badge--green' : 'fitlo-badge--gray'
                        }`}
                        title="Click to toggle active status"
                      >
                        {partner.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </div>

                    {/* Partner Rates: Discount & Tax Badges */}
                    <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-[var(--fitlo-surface)] border border-[var(--fitlo-line)] text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                          <Percent size={13} />
                        </div>
                        <div>
                          <span className="text-[9px] uppercase font-bold tracking-wider text-[var(--fitlo-muted)] block">Discount</span>
                          <span className="font-bold text-emerald-600 text-xs">
                            {discountNum > 0 ? `${discountNum}% OFF` : 'No discount'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 border-l border-[var(--fitlo-line)] pl-2.5">
                        <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                          <Receipt size={13} />
                        </div>
                        <div>
                          <span className="text-[9px] uppercase font-bold tracking-wider text-[var(--fitlo-muted)] block">Tax Rate</span>
                          <span className="font-bold text-blue-600 text-xs">
                            {taxNum > 0 ? `${taxNum}% Tax` : '0% Tax'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Contact & Bio */}
                    {partner.whatsapp && (
                      <div className="text-[11px] text-[var(--fitlo-muted)] flex items-center gap-1.5">
                        <Phone size={12} className="text-emerald-500" />
                        <span>{partner.whatsapp}</span>
                      </div>
                    )}

                    {partner.description && (
                      <p className="text-xs text-[var(--fitlo-muted)] line-clamp-2 leading-relaxed">
                        {partner.description}
                      </p>
                    )}
                  </div>

                  {/* Footer Action Row */}
                  <div className="mt-5 pt-3.5 border-t border-[var(--fitlo-line)] flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPartnerFilter(partner.id);
                        setActiveSubTab('treatments');
                      }}
                      className="text-xs font-bold text-[var(--fitlo-ink)] hover:text-[var(--fitlo-accent)] flex items-center gap-1.5 transition-colors"
                    >
                      <Layers size={13} />
                      <span>{partnerTreatmentsCount} {partnerTreatmentsCount === 1 ? 'Treatment' : 'Treatments'}</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openNewTreatmentModal(partner.id)}
                        className="p-1.5 rounded-lg bg-[var(--fitlo-surface)] hover:bg-[var(--fitlo-accent)] hover:text-white text-[var(--fitlo-ink)] transition-colors"
                        title="Add treatment for this partner"
                      >
                        <Plus size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => openEditPartnerModal(partner, e)}
                        className="p-1.5 rounded-lg bg-[var(--fitlo-surface)] hover:bg-[var(--fitlo-line)] text-[var(--fitlo-muted)] hover:text-[var(--fitlo-ink)] transition-colors"
                        title="Edit Partner Profile"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeletePartner(partner, e)}
                        className="p-1.5 rounded-lg bg-[var(--fitlo-surface)] hover:bg-rose-50 hover:text-rose-600 text-[var(--fitlo-muted)] transition-colors"
                        title="Delete Partner Profile"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (

        /* ─────────────────────────────────────────────────────────────────────────────
           TAB 2: TREATMENTS LIST UNDER PARTNERS
           ───────────────────────────────────────────────────────────────────────────── */
        partners.length === 0 ? (
          <div className="card p-12 text-center max-w-xl mx-auto space-y-4 border-dashed border-2">
            <div className="w-14 h-14 rounded-2xl bg-[color-mix(in_srgb,var(--fitlo-accent)_12%,transparent)] text-[var(--fitlo-accent)] flex items-center justify-center mx-auto">
              <Building2 size={28} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--fitlo-ink)]">Please Create a Partner Profile First</h3>
              <p className="text-xs text-[var(--fitlo-muted)] mt-1.5 max-w-md mx-auto leading-relaxed">
                Treatments are organized under partner profiles. Once you create a partner spa profile with their discount and tax settings, you can add treatments to them.
              </p>
            </div>
            <button
              type="button"
              onClick={openNewPartnerModal}
              className="fitlo-btn fitlo-btn--primary mx-auto"
            >
              <Plus size={16} />
              <span>Create Partner Profile</span>
            </button>
          </div>
        ) : filteredTreatments.length === 0 ? (
          <div className="card p-12 text-center max-w-xl mx-auto space-y-4 border-dashed border-2">
            <div className="w-14 h-14 rounded-2xl bg-[color-mix(in_srgb,var(--fitlo-accent)_12%,transparent)] text-[var(--fitlo-accent)] flex items-center justify-center mx-auto">
              <Layers size={28} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--fitlo-ink)]">No treatments found</h3>
              <p className="text-xs text-[var(--fitlo-muted)] mt-1.5 max-w-md mx-auto leading-relaxed">
                {selectedPartnerFilter === 'all'
                  ? 'Add treatments for your spa partners with duration options and prices. They will appear live on the storefront.'
                  : `No treatments have been added under "${partners.find(p => p.id === selectedPartnerFilter)?.name || 'this partner'}" yet.`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => openNewTreatmentModal(selectedPartnerFilter !== 'all' ? selectedPartnerFilter : undefined)}
              className="fitlo-btn fitlo-btn--primary mx-auto"
            >
              <Plus size={16} />
              <span>Add First Treatment</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTreatments.map((treatment) => {
              const opts = treatment.options || [];
              const firstOpt = opts[0] || { duration: '60', price: '450,000' };
              const originalPrice = parseInt(String(firstOpt.price).replace(/[^0-9]/g, '') || '0', 10);
              const discountRate = Number(treatment.partner_discount_percentage) || 0;
              const taxRate = Number(treatment.partner_tax_percentage) || 0;

              const discountedPrice = discountRate > 0
                ? Math.round(originalPrice * (1 - discountRate / 100))
                : originalPrice;

              const finalWithTax = taxRate > 0
                ? Math.round(discountedPrice * (1 + taxRate / 100))
                : discountedPrice;

              return (
                <div
                  key={treatment.id}
                  className="card p-0 overflow-hidden flex flex-col justify-between hover:border-[var(--fitlo-accent)] transition-all group"
                >
                  <div>
                    {/* Treatment Cover Photo */}
                    <div className="relative h-44 w-full bg-[var(--fitlo-surface)] overflow-hidden">
                      {treatment.image_url ? (
                        <img
                          src={treatment.image_url}
                          alt={treatment.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-[var(--fitlo-muted)] gap-1">
                          <ImageIcon size={28} strokeWidth={1.5} />
                          <span className="text-[10px] uppercase font-bold tracking-wider">No cover image</span>
                        </div>
                      )}

                      {/* Category Floating Pill */}
                      <div className="absolute top-3 left-3 z-10">
                        <span className="px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md text-white text-[9px] font-bold tracking-wider uppercase">
                          {treatment.category}
                        </span>
                      </div>

                      {/* Publish Status */}
                      <div className="absolute top-3 right-3 z-10">
                        <button
                          type="button"
                          onClick={(e) => toggleTreatmentPublish(treatment, e)}
                          className={`fitlo-badge text-[10px] font-bold cursor-pointer ${
                            treatment.is_published ? 'fitlo-badge--green' : 'fitlo-badge--gray'
                          }`}
                          title="Click to toggle publish status"
                        >
                          {treatment.is_published ? 'Published' : 'Draft'}
                        </button>
                      </div>

                      {/* Partner Name overlay bar */}
                      <div className="absolute bottom-0 inset-x-0 p-3 bg-linear-to-t from-black/85 via-black/45 to-transparent flex items-center justify-between z-10">
                        <div className="flex items-center gap-2">
                          {treatment.partner_logo_url ? (
                            <img
                              src={treatment.partner_logo_url}
                              alt={treatment.partner_name}
                              className="w-6 h-6 rounded-full object-cover border border-white/60 bg-white shrink-0"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center font-bold text-[9px] shrink-0">
                              {treatment.partner_name.charAt(0)}
                            </div>
                          )}
                          <span className="text-xs font-bold text-white tracking-wide truncate max-w-[180px]">
                            {treatment.partner_name}
                          </span>
                        </div>

                        {discountRate > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[9px] font-bold tracking-wide">
                            {discountRate}% OFF
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-4 space-y-3">
                      <h4 className="font-bold text-sm text-[var(--fitlo-ink)] leading-snug">
                        {treatment.title}
                      </h4>

                      {treatment.desc && (
                        <p className="text-xs text-[var(--fitlo-muted)] line-clamp-2 leading-relaxed">
                          {treatment.desc}
                        </p>
                      )}

                      {/* Duration Pills */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {opts.map((opt, oIdx) => (
                          <span
                            key={oIdx}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-[var(--fitlo-surface)] text-[var(--fitlo-ink)] text-[10px] font-bold uppercase tracking-wider"
                          >
                            <Clock size={10} className="text-[var(--fitlo-muted)]" />
                            {String(opt.duration).toUpperCase().includes('MIN') ? opt.duration : `${opt.duration} MINS`}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Pricing Breakdown & Actions */}
                  <div className="p-4 pt-0">
                    <div className="pt-3 border-t border-[var(--fitlo-line)] flex items-center justify-between gap-3">
                      <div>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--fitlo-muted)] block">Customer Rate</span>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-sm font-bold text-[var(--fitlo-ink)]">
                            IDR {finalWithTax.toLocaleString('en-US')}
                          </span>
                          {discountRate > 0 && (
                            <span className="text-[10px] text-[var(--fitlo-muted)] line-through">
                              IDR {originalPrice.toLocaleString('en-US')}
                            </span>
                          )}
                        </div>
                        {taxRate > 0 && (
                          <span className="text-[9px] text-[var(--fitlo-muted)] font-medium">
                            incl. {taxRate}% tax
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => openEditTreatmentModal(treatment, e)}
                          className="p-1.5 rounded-lg bg-[var(--fitlo-surface)] hover:bg-[var(--fitlo-line)] text-[var(--fitlo-muted)] hover:text-[var(--fitlo-ink)] transition-colors"
                          title="Edit Treatment"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteTreatment(treatment.id, e)}
                          className="p-1.5 rounded-lg bg-[var(--fitlo-surface)] hover:bg-rose-50 hover:text-rose-600 text-[var(--fitlo-muted)] transition-colors"
                          title="Delete Treatment"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
         MODAL 1: PARTNER PROFILE (ADD / EDIT)
         ───────────────────────────────────────────────────────────────────────────── */}
      {isPartnerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="card w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl border border-[var(--fitlo-line)] bg-[var(--fitlo-card)] p-6 space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[var(--fitlo-line)]">
              <div>
                <h3 className="text-base font-bold text-[var(--fitlo-ink)]">
                  {editingPartner ? 'Edit Partner Spa Profile' : 'New Partner Spa Profile'}
                </h3>
                <p className="text-xs text-[var(--fitlo-muted)] mt-0.5">
                  Set partner brand details, location, and specific discount &amp; tax rates.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPartnerModalOpen(false)}
                className="p-1.5 rounded-lg text-[var(--fitlo-muted)] hover:text-[var(--fitlo-ink)] hover:bg-[var(--fitlo-surface)]"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePartner} className="space-y-4">
              {/* Partner Name & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--fitlo-ink)] mb-1">
                    Partner Spa Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jaens Spa Ubud"
                    value={partnerForm.name}
                    onChange={e => setPartnerForm({ ...partnerForm, name: e.target.value })}
                    className="fitlo-input w-full text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--fitlo-ink)] mb-1">
                    Location / Area
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Jl. Raya Pengosekan, Ubud"
                    value={partnerForm.location}
                    onChange={e => setPartnerForm({ ...partnerForm, location: e.target.value })}
                    className="fitlo-input w-full text-xs"
                  />
                </div>
              </div>

              {/* Rates: Discount Percentage & Tax Percentage */}
              <div className="p-3.5 rounded-xl bg-[var(--fitlo-surface)] border border-[var(--fitlo-line)] space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--fitlo-ink)] flex items-center gap-1.5">
                  <Percent size={13} className="text-[var(--fitlo-accent)]" />
                  Partner Specific Rates
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[var(--fitlo-ink)] mb-1">
                      Discount Percentage (%)
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type="number"
                        min="0"
                        max="90"
                        step="1"
                        placeholder="e.g. 10"
                        value={partnerForm.discount_percentage}
                        onChange={e => setPartnerForm({ ...partnerForm, discount_percentage: Number(e.target.value) })}
                        className="fitlo-input w-full text-xs font-bold pr-8"
                      />
                      <span className="absolute right-3 text-xs font-bold text-[var(--fitlo-muted)]">%</span>
                    </div>
                    <span className="text-[10px] text-[var(--fitlo-muted)] mt-1 block">Applied to treatments from this partner</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[var(--fitlo-ink)] mb-1">
                      Tax Percentage (%)
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type="number"
                        min="0"
                        max="30"
                        step="0.5"
                        placeholder="e.g. 11"
                        value={partnerForm.tax_percentage}
                        onChange={e => setPartnerForm({ ...partnerForm, tax_percentage: Number(e.target.value) })}
                        className="fitlo-input w-full text-xs font-bold pr-8"
                      />
                      <span className="absolute right-3 text-xs font-bold text-[var(--fitlo-muted)]">%</span>
                    </div>
                    <span className="text-[10px] text-[var(--fitlo-muted)] mt-1 block">e.g. 11% PB1 local government tax</span>
                  </div>
                </div>
              </div>

              {/* WhatsApp Contact */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--fitlo-ink)] mb-1">
                  Partner WhatsApp / Phone
                </label>
                <input
                  type="text"
                  placeholder="e.g. +62 812 3456 7890"
                  value={partnerForm.whatsapp}
                  onChange={e => setPartnerForm({ ...partnerForm, whatsapp: e.target.value })}
                  className="fitlo-input w-full text-xs"
                />
              </div>

              {/* Partner Logo Upload & URL */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--fitlo-ink)] mb-1">
                  Partner Company Logo
                </label>
                <div className="flex items-center gap-3">
                  {partnerForm.logo_url ? (
                    <img
                      src={partnerForm.logo_url}
                      alt="Logo preview"
                      className="w-12 h-12 rounded-xl object-cover border border-[var(--fitlo-line)] bg-white shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-[var(--fitlo-surface)] border border-[var(--fitlo-line)] flex items-center justify-center text-[var(--fitlo-muted)] shrink-0">
                      <Building2 size={20} />
                    </div>
                  )}

                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <label className="fitlo-btn fitlo-btn--secondary cursor-pointer text-xs py-1.5 px-3">
                        <Upload size={13} />
                        <span>{isUploadingPartnerLogo ? 'Uploading...' : 'Upload Logo'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'partner-logo')}
                          disabled={isUploadingPartnerLogo}
                        />
                      </label>
                      {partnerForm.logo_url && (
                        <button
                          type="button"
                          onClick={() => setPartnerForm({ ...partnerForm, logo_url: '' })}
                          className="text-xs text-rose-500 hover:underline"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <input
                      type="url"
                      placeholder="Or paste public logo URL..."
                      value={partnerForm.logo_url}
                      onChange={e => setPartnerForm({ ...partnerForm, logo_url: e.target.value })}
                      className="fitlo-input w-full text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--fitlo-ink)] mb-1">
                  Description / Note
                </label>
                <textarea
                  rows={2}
                  placeholder="Premier boutique spa in Ubud surrounded by lush garden gazebos..."
                  value={partnerForm.description}
                  onChange={e => setPartnerForm({ ...partnerForm, description: e.target.value })}
                  className="fitlo-input w-full text-xs resize-none"
                />
              </div>

              {/* Order & Active Toggle */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--fitlo-ink)] mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={partnerForm.order}
                    onChange={e => setPartnerForm({ ...partnerForm, order: Number(e.target.value) })}
                    className="fitlo-input w-full text-xs"
                  />
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2.5 cursor-pointer pb-2">
                    <input
                      type="checkbox"
                      checked={partnerForm.is_active}
                      onChange={e => setPartnerForm({ ...partnerForm, is_active: e.target.checked })}
                      className="rounded accent-[var(--fitlo-accent)] w-4 h-4 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-[var(--fitlo-ink)]">Active on Platform</span>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-[var(--fitlo-line)] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPartnerModalOpen(false)}
                  className="fitlo-btn fitlo-btn--secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="fitlo-btn fitlo-btn--primary"
                >
                  {isSubmitting ? 'Saving...' : editingPartner ? 'Update Profile' : 'Create Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
         MODAL 2: TREATMENT (ADD / EDIT UNDER A PARTNER)
         ───────────────────────────────────────────────────────────────────────────── */}
      {isTreatmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="card w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl border border-[var(--fitlo-line)] bg-[var(--fitlo-card)] p-6 space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[var(--fitlo-line)]">
              <div>
                <h3 className="text-base font-bold text-[var(--fitlo-ink)]">
                  {editingTreatment ? 'Edit Partner Treatment' : 'Add Treatment Under Partner'}
                </h3>
                <p className="text-xs text-[var(--fitlo-muted)] mt-0.5">
                  Treatment inherits its partner&apos;s discount &amp; tax settings automatically.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsTreatmentModalOpen(false)}
                className="p-1.5 rounded-lg text-[var(--fitlo-muted)] hover:text-[var(--fitlo-ink)] hover:bg-[var(--fitlo-surface)]"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveTreatment} className="space-y-4">
              {/* Partner Selector Dropdown */}
              <div className="p-3.5 rounded-xl bg-[var(--fitlo-surface)] border border-[var(--fitlo-line)] space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--fitlo-ink)]">
                  1. Select Partner Spa Profile *
                </label>
                <select
                  required
                  value={treatmentForm.partner_id}
                  onChange={e => setTreatmentForm({ ...treatmentForm, partner_id: e.target.value })}
                  className="fitlo-select w-full text-xs font-bold"
                >
                  <option value="" disabled>-- Choose Partner Spa --</option>
                  {partners.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.location ? `(${p.location})` : ''} — {Number(p.discount_percentage) || 0}% OFF | {Number(p.tax_percentage) || 0}% Tax
                    </option>
                  ))}
                </select>

                {modalSelectedPartner && (
                  <div className="flex items-center justify-between pt-1 text-xs">
                    <span className="text-[var(--fitlo-muted)]">
                      Rates: <strong className="text-emerald-600">{Number(modalSelectedPartner.discount_percentage) || 0}% Discount</strong> · <strong className="text-blue-600">{Number(modalSelectedPartner.tax_percentage) || 0}% Tax</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => openEditPartnerModal(modalSelectedPartner)}
                      className="text-[11px] text-[var(--fitlo-accent)] font-semibold hover:underline"
                    >
                      Edit partner rates
                    </button>
                  </div>
                )}
              </div>

              {/* Treatment Title & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--fitlo-ink)] mb-1">
                    Treatment Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Traditional Balinese Deep Tissue Massage"
                    value={treatmentForm.title}
                    onChange={e => setTreatmentForm({ ...treatmentForm, title: e.target.value })}
                    className="fitlo-input w-full text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--fitlo-ink)] mb-1">
                    Category
                  </label>
                  <select
                    value={treatmentForm.category}
                    onChange={e => setTreatmentForm({ ...treatmentForm, category: e.target.value })}
                    className="fitlo-select w-full text-xs font-semibold"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--fitlo-ink)] mb-1">
                  Description / Highlights
                </label>
                <textarea
                  rows={2}
                  placeholder="Luxurious signature ritual performed in private garden gazebo at partner spa..."
                  value={treatmentForm.desc}
                  onChange={e => setTreatmentForm({ ...treatmentForm, desc: e.target.value })}
                  className="fitlo-input w-full text-xs resize-none"
                />
              </div>

              {/* Cover Photo Upload & URL */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--fitlo-ink)] mb-1">
                  Treatment Cover Photo
                </label>
                <div className="flex items-center gap-3">
                  {treatmentForm.image_url ? (
                    <img
                      src={treatmentForm.image_url}
                      alt="Treatment preview"
                      className="w-16 h-12 rounded-xl object-cover border border-[var(--fitlo-line)] bg-white shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-12 rounded-xl bg-[var(--fitlo-surface)] border border-[var(--fitlo-line)] flex items-center justify-center text-[var(--fitlo-muted)] shrink-0">
                      <ImageIcon size={20} />
                    </div>
                  )}

                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <label className="fitlo-btn fitlo-btn--secondary cursor-pointer text-xs py-1.5 px-3">
                        <Upload size={13} />
                        <span>{isUploadingTreatmentImage ? 'Uploading...' : 'Upload Image'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'treatment-image')}
                          disabled={isUploadingTreatmentImage}
                        />
                      </label>
                      {treatmentForm.image_url && (
                        <button
                          type="button"
                          onClick={() => setTreatmentForm({ ...treatmentForm, image_url: '' })}
                          className="text-xs text-rose-500 hover:underline"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <input
                      type="url"
                      placeholder="Or paste public image URL..."
                      value={treatmentForm.image_url}
                      onChange={e => setTreatmentForm({ ...treatmentForm, image_url: e.target.value })}
                      className="fitlo-input w-full text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Duration & Price Options */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--fitlo-ink)]">
                    Duration &amp; Base Price (IDR)
                  </label>
                  <button
                    type="button"
                    onClick={addOptionRow}
                    className="text-xs font-bold text-[var(--fitlo-accent)] hover:underline flex items-center gap-1"
                  >
                    <Plus size={13} />
                    <span>Add Duration</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {treatmentForm.options.map((opt, idx) => {
                    const basePriceNum = parseInt(String(opt.price).replace(/[^0-9]/g, '') || '0', 10);
                    const partnerDiscount = Number(modalSelectedPartner?.discount_percentage) || 0;
                    const partnerTax = Number(modalSelectedPartner?.tax_percentage) || 0;
                    const discounted = partnerDiscount > 0 ? Math.round(basePriceNum * (1 - partnerDiscount / 100)) : basePriceNum;
                    const finalCustomerPay = partnerTax > 0 ? Math.round(discounted * (1 + partnerTax / 100)) : discounted;

                    return (
                      <div key={idx} className="p-2.5 rounded-xl bg-[var(--fitlo-surface)] border border-[var(--fitlo-line)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2 flex-1">
                          <div className="w-28 shrink-0">
                            <input
                              type="text"
                              required
                              placeholder="e.g. 60"
                              value={opt.duration}
                              onChange={e => updateOptionRow(idx, 'duration', e.target.value)}
                              className="fitlo-input w-full text-xs text-center font-bold"
                            />
                            <span className="text-[9px] text-[var(--fitlo-muted)] block text-center mt-0.5">Mins</span>
                          </div>

                          <div className="flex-1">
                            <input
                              type="text"
                              required
                              placeholder="e.g. 450,000"
                              value={opt.price}
                              onChange={e => updateOptionRow(idx, 'price', e.target.value)}
                              className="fitlo-input w-full text-xs font-bold"
                            />
                            <span className="text-[9px] text-[var(--fitlo-muted)] block mt-0.5">Base IDR</span>
                          </div>
                        </div>

                        {/* Live calculation box */}
                        <div className="sm:w-48 text-right px-2 border-t sm:border-t-0 sm:border-l border-[var(--fitlo-line)] pt-2 sm:pt-0">
                          <span className="text-[9px] uppercase font-bold tracking-wider text-[var(--fitlo-muted)] block">Customer Pays</span>
                          <span className="text-xs font-black text-emerald-600 block">
                            IDR {finalCustomerPay.toLocaleString('en-US')}
                          </span>
                          {(partnerDiscount > 0 || partnerTax > 0) && (
                            <span className="text-[9px] text-[var(--fitlo-muted)] block">
                              {partnerDiscount > 0 ? `-${partnerDiscount}% off` : ''} {partnerTax > 0 ? `+${partnerTax}% tax` : ''}
                            </span>
                          )}
                        </div>

                        {treatmentForm.options.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeOptionRow(idx)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 self-end sm:self-center"
                            title="Remove duration"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Order & Publish */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--fitlo-ink)] mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={treatmentForm.order}
                    onChange={e => setTreatmentForm({ ...treatmentForm, order: Number(e.target.value) })}
                    className="fitlo-input w-full text-xs"
                  />
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2.5 cursor-pointer pb-2">
                    <input
                      type="checkbox"
                      checked={treatmentForm.is_published}
                      onChange={e => setTreatmentForm({ ...treatmentForm, is_published: e.target.checked })}
                      className="rounded accent-[var(--fitlo-accent)] w-4 h-4 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-[var(--fitlo-ink)]">Published on Website</span>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-[var(--fitlo-line)] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTreatmentModalOpen(false)}
                  className="fitlo-btn fitlo-btn--secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="fitlo-btn fitlo-btn--primary"
                >
                  {isSubmitting ? 'Saving...' : editingTreatment ? 'Update Treatment' : 'Save Treatment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
