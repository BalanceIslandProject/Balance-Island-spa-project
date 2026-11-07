'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Building2, Plus, Edit2, Trash2, CheckCircle2, 
  MapPin, Clock, Tag, Image as ImageIcon, Upload, 
  X, ExternalLink, Sparkles, Phone, Percent, Receipt,
  ChevronDown, Filter, Eye, Layers, AlertCircle,
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, MessageCircle, DollarSign, User
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useSpa, SpaPartner, PartnerTreatment } from '@/context/SpaContext';
import { parseTreatmentInclusions, formatTreatmentDescription } from '@/lib/treatmentUtils';

interface DurationOption {
  duration: string;
  price: string;
  net_price?: string;
}

const CATEGORIES = ['Massage', 'Package', 'Couple Package', 'Facial', 'Body Scrub', 'Wellness', 'Hair Spa'];

export default function TherapickPartnerSpasView() {
  const { 
    spaPartners: contextPartners, setSpaPartners: setContextPartners,
    partnerTreatments: contextTreatments, setPartnerTreatments: setContextTreatments 
  } = useSpa();

  // Active Sub-Tab: 'partners' (Profiles) | 'treatments' (Treatments) | 'calendar' (Bookings Calendar)
  const [activeSubTab, setActiveSubTab] = useState<'partners' | 'treatments' | 'calendar'>('partners');
  const [selectedPartnerFilter, setSelectedPartnerFilter] = useState<string>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  const [partners, setPartners] = useState<SpaPartner[]>([]);
  const [treatments, setTreatments] = useState<PartnerTreatment[]>([]);
  const [partnerBookings, setPartnerBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // ── Calendar Sub-Tab State ──
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });

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
    experience_desc: '',
    inclusions: [] as { name: string; duration: string }[],
    image_url: '',
    order: 1,
    is_published: true,
    options: [
      { duration: '60', price: '450,000', net_price: '' },
      { duration: '90', price: '600,000', net_price: '' }
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
      const [partnersRes, treatmentsRes, bookingsRes] = await Promise.all([
        supabase
          .from('spa_partners')
          .select('*')
          .or('brand.eq.therapick,brand.is.null')
          .order('order', { ascending: true })
          .order('created_at', { ascending: false }),
        supabase
          .from('partner_treatments')
          .select('*')
          .or('brand.eq.therapick,brand.is.null')
          .order('order', { ascending: true })
          .order('created_at', { ascending: false }),
        supabase
          .from('bookings')
          .select('*')
          .order('created_at', { ascending: false })
      ]);

      clearTimeout(timer);

      let fetchedPartners = (partnersRes.data || []) as SpaPartner[];
      const fetchedTreatments = (treatmentsRes.data || []) as PartnerTreatment[];

      // ── Robust Self-Healing Fallback ──
      // If treatments exist that reference a partner profile which is missing or desynced,
      // synthesize and persist the partner profile immediately so the admin never sees 0 profiles.
      if (fetchedTreatments.length > 0) {
        const missingMap = new Map<string, SpaPartner>();
        for (const t of fetchedTreatments) {
          const pId = t.partner_id;
          const pName = t.partner_name;
          if (pId && !fetchedPartners.some(p => p.id === pId)) {
            missingMap.set(pId, {
              id: pId,
              brand: 'therapick',
              name: pName || 'Jaens Spa Center Ubud',
              slug: (pName || 'jaens-spa').toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'),
              location: t.partner_location || 'Jl. Raya Pengosekan Ubud',
              logo_url: t.partner_logo_url || null,
              whatsapp: t.partner_whatsapp || null,
              discount_percentage: t.partner_discount_percentage ?? 5,
              tax_percentage: t.partner_tax_percentage ?? 17.5,
              description: 'Verified partner spa offering exclusive on-site treatments.',
              is_active: true,
              order: 1
            });
          }
        }
        if (missingMap.size > 0) {
          const synthesized = Array.from(missingMap.values());
          fetchedPartners = [...fetchedPartners, ...synthesized];
          // Background sync to database
          synthesized.forEach(syn => {
            supabase.from('spa_partners').upsert(syn).then(() => {});
          });
        }
      }

      setPartners(fetchedPartners);
      setContextPartners(fetchedPartners);
      setTreatments(fetchedTreatments);
      setContextTreatments(fetchedTreatments);

      // Extract real partner spa bookings from bookings table
      if (bookingsRes.data) {
        const partnerOnlyBookings = bookingsRes.data.filter((b: any) => {
          if (Array.isArray(b.items) && b.items.length > 0) {
            return b.items.some((i: any) => i.isPartner || i.partnerName || i.partner_name || i.publishedPrice);
          }
          if (b.treatment_name && (b.treatment_name.toLowerCase().includes('jaens') || b.treatment_name.toLowerCase().includes('partner'))) {
            return true;
          }
          return false;
        });
        setPartnerBookings(partnerOnlyBookings);
      } else {
        setPartnerBookings([]);
      }
    } catch (err) {
      console.warn('Notice loading partner spa data:', err);
      clearTimeout(timer);
    } finally {
      setLoading(false);
    }
  }, [setContextPartners, setContextTreatments]);

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
      category: 'Package',
      desc: '',
      experience_desc: '',
      inclusions: [
        { name: '', duration: '60' },
        { name: '', duration: '45' }
      ],
      image_url: '',
      order: (treatments.length || 0) + 1,
      is_published: true,
      options: [
        { duration: '120', price: '950,000', net_price: '' }
      ]
    });
    setIsTreatmentModalOpen(true);
  };

  const openEditTreatmentModal = (item: PartnerTreatment, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingTreatment(item);
    const parsed = parseTreatmentInclusions(item.desc);
    setTreatmentForm({
      partner_id: item.partner_id || partners.find(p => p.name === item.partner_name)?.id || partners[0]?.id || '',
      title: item.title,
      category: item.category || 'Massage',
      desc: item.desc || '',
      experience_desc: parsed.descClean,
      inclusions: parsed.inclusions.length > 0
        ? parsed.inclusions.map(inc => ({
            name: inc.name,
            duration: inc.duration.replace(/[^0-9]/g, '') || inc.duration
          }))
        : [{ name: '', duration: '' }],
      image_url: item.image_url || '',
      order: item.order || 1,
      is_published: item.is_published !== false,
      options: item.options && item.options.length > 0
        ? item.options.map(o => ({
            duration: o.duration,
            price: o.price,
            net_price: (o as any).net_price ? String((o as any).net_price) : ''
          }))
        : [{ duration: '60', price: '450,000', net_price: '' }]
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

    const finalDesc = formatTreatmentDescription(
      treatmentForm.experience_desc || treatmentForm.desc,
      treatmentForm.inclusions
    );

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
      desc: finalDesc.trim() || null,
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
      options: [...prev.options, { duration: '120', price: '750,000', net_price: '' }]
    }));
  };

  const removeOptionRow = (index: number) => {
    setTreatmentForm(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  const updateOptionRow = (index: number, field: 'duration' | 'price' | 'net_price', val: string) => {
    setTreatmentForm(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => i === index ? { ...opt, [field]: val } : opt)
    }));
  };

  // Filtered treatments list
  const filteredTreatments = useMemo(() => {
    return treatments.filter(t => {
      const matchesPartner = selectedPartnerFilter === 'all' || 
        t.partner_id === selectedPartnerFilter || 
        t.partner_name === partners.find(p => p.id === selectedPartnerFilter)?.name;

      const catLower = (t.category || '').toLowerCase();
      const filterLower = selectedCategoryFilter.toLowerCase();
      const matchesCategory = selectedCategoryFilter === 'all' || 
        (filterLower === 'couple package'
          ? (catLower.includes('couple') || /couple|honeymoon|duo/i.test(t.title || ''))
          : catLower === filterLower);

      return matchesPartner && matchesCategory;
    });
  }, [treatments, selectedPartnerFilter, selectedCategoryFilter, partners]);

  // Current selected partner for live price calculation in treatment modal
  const modalSelectedPartner = useMemo(() => {
    return partners.find(p => p.id === treatmentForm.partner_id) || null;
  }, [partners, treatmentForm.partner_id]);

  // ── Calendar Helpers & Handlers ──
  const handlePrevMonth = () => {
    setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleTodayMonth = () => {
    const now = new Date();
    setCalendarMonth(now);
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    setSelectedCalendarDate(`${y}-${m}-${d}`);
  };

  const calendarYear = calendarMonth.getFullYear();
  const calendarMonthIndex = calendarMonth.getMonth();
  const calendarMonthName = calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const getBookingDate = (b: any): string => {
    const raw = b.booking_date || b.date || (b.created_at ? b.created_at.split('T')[0] : '');
    return String(raw).split('T')[0].trim();
  };

  const filteredCalendarBookings = useMemo(() => {
    if (selectedPartnerFilter === 'all') return partnerBookings;
    const selectedPartner = partners.find(p => p.id === selectedPartnerFilter);
    return partnerBookings.filter(b => {
      if (Array.isArray(b.items)) {
        return b.items.some((i: any) => 
          i.partnerId === selectedPartnerFilter || 
          i.partner_id === selectedPartnerFilter || 
          i.partnerName === selectedPartner?.name || 
          i.partner_name === selectedPartner?.name
        );
      }
      return b.venue === selectedPartner?.name;
    });
  }, [partnerBookings, selectedPartnerFilter, partners]);

  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(calendarYear, calendarMonthIndex, 1);
    const lastDayOfMonth = new Date(calendarYear, calendarMonthIndex + 1, 0);

    // Monday as 0: (day + 6) % 7
    let startDayIndex = (firstDayOfMonth.getDay() + 6) % 7;
    const daysInMonth = lastDayOfMonth.getDate();
    const days: { dateStr: string; dayNum: number; isCurrentMonth: boolean; isToday: boolean }[] = [];

    const prevMonthLastDay = new Date(calendarYear, calendarMonthIndex, 0).getDate();
    for (let i = startDayIndex - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const prevDate = new Date(calendarYear, calendarMonthIndex - 1, d);
      const y = prevDate.getFullYear();
      const m = String(prevDate.getMonth() + 1).padStart(2, '0');
      const dayStr = String(d).padStart(2, '0');
      days.push({
        dateStr: `${y}-${m}-${dayStr}`,
        dayNum: d,
        isCurrentMonth: false,
        isToday: false
      });
    }

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    for (let d = 1; d <= daysInMonth; d++) {
      const dayStr = String(d).padStart(2, '0');
      const mStr = String(calendarMonthIndex + 1).padStart(2, '0');
      const dateStr = `${calendarYear}-${mStr}-${dayStr}`;
      days.push({
        dateStr,
        dayNum: d,
        isCurrentMonth: true,
        isToday: dateStr === todayStr
      });
    }

    const remaining = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextDate = new Date(calendarYear, calendarMonthIndex + 1, d);
      const y = nextDate.getFullYear();
      const m = String(nextDate.getMonth() + 1).padStart(2, '0');
      const dayStr = String(d).padStart(2, '0');
      days.push({
        dateStr: `${y}-${m}-${dayStr}`,
        dayNum: d,
        isCurrentMonth: false,
        isToday: false
      });
    }

    return days;
  }, [calendarYear, calendarMonthIndex]);

  // Bookings grouped by date string for fast map lookup in calendar grid
  const bookingsByDate = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const b of filteredCalendarBookings) {
      const dateStr = getBookingDate(b);
      if (dateStr) {
        if (!map.has(dateStr)) map.set(dateStr, []);
        map.get(dateStr)!.push(b);
      }
    }
    return map;
  }, [filteredCalendarBookings]);

  // Selected date bookings
  const selectedDateBookings = useMemo(() => {
    return bookingsByDate.get(selectedCalendarDate) || [];
  }, [bookingsByDate, selectedCalendarDate]);

  // Monthly stats
  const currentMonthBookings = useMemo(() => {
    const mStr = String(calendarMonthIndex + 1).padStart(2, '0');
    const prefix = `${calendarYear}-${mStr}`;
    return filteredCalendarBookings.filter(b => getBookingDate(b).startsWith(prefix));
  }, [filteredCalendarBookings, calendarYear, calendarMonthIndex]);

  // Helper to compute revenue, net cost, and profit for any partner booking
  const getBookingFinancials = useCallback((b: any) => {
    const totalRev = Number(b.revenue || b.total_price || 0);
    const item = Array.isArray(b.items) && b.items.length > 0 ? b.items[0] : null;
    const pax = Number(item?.guests || b.pax || 1);

    // 1. Direct net_price on booking item
    let netPerPerson = 0;
    if (item?.net_price) {
      netPerPerson = parseInt(String(item.net_price).replace(/[^0-9]/g, '') || '0', 10);
    } else {
      // 2. Lookup in treatments by treatmentId or title
      const cleanTitle = (item?.title || b.treatment_name || '').split('·')[0].trim().toLowerCase();
      const matched = treatments.find(t => 
        (item?.treatmentId && t.id === item.treatmentId) ||
        t.title.toLowerCase().trim() === cleanTitle ||
        cleanTitle.includes(t.title.toLowerCase().trim())
      );
      if (matched && Array.isArray(matched.options) && matched.options.length > 0) {
        const durStr = String(item?.duration || '').replace(/[^0-9]/g, '');
        const matchedOpt = matched.options.find((o: any) => String(o.duration).replace(/[^0-9]/g, '') === durStr) || matched.options[0];
        if (matchedOpt && (matchedOpt as any).net_price) {
          netPerPerson = parseInt(String((matchedOpt as any).net_price).replace(/[^0-9]/g, '') || '0', 10);
        }
      }
    }

    const totalNetCost = netPerPerson > 0 ? (netPerPerson * pax) : 0;
    const profit = (totalRev > 0 && totalNetCost > 0) ? (totalRev - totalNetCost) : 0;

    return {
      totalRev,
      pax,
      netPerPerson,
      totalNetCost,
      profit
    };
  }, [treatments]);

  // Aggregate financials for current month
  const monthStats = useMemo(() => {
    let rev = 0;
    let net = 0;
    let prof = 0;

    for (const b of currentMonthBookings) {
      const fin = getBookingFinancials(b);
      rev += fin.totalRev;
      net += fin.totalNetCost;
      prof += fin.profit;
    }

    return { rev, net, prof };
  }, [currentMonthBookings, getBookingFinancials]);

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
            Create real partner spa profiles with custom discount and tax rates, track appointments on the partner calendar, and manage treatments.
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
          ) : activeSubTab === 'treatments' ? (
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
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTodayMonth}
                className="fitlo-btn fitlo-btn--secondary text-xs"
              >
                <CalendarIcon size={14} />
                <span>Today</span>
              </button>
              <div className="flex items-center rounded-xl border border-[var(--fitlo-line)] bg-[var(--fitlo-surface)] p-0.5">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-lg hover:bg-white text-[var(--fitlo-muted)] hover:text-[var(--fitlo-ink)] transition-colors"
                  title="Previous Month"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="px-2.5 text-xs font-bold text-[var(--fitlo-ink)] min-w-[120px] text-center">
                  {calendarMonthName}
                </span>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-lg hover:bg-white text-[var(--fitlo-muted)] hover:text-[var(--fitlo-ink)] transition-colors"
                  title="Next Month"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
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

          <button
            type="button"
            onClick={() => setActiveSubTab('calendar')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'calendar'
                ? 'bg-[var(--fitlo-ink)] text-[var(--fitlo-card)] shadow-xs'
                : 'bg-[var(--fitlo-surface)] text-[var(--fitlo-muted)] hover:text-[var(--fitlo-ink)]'
            }`}
          >
            <CalendarIcon size={14} />
            <span>Calendar</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${
              activeSubTab === 'calendar' ? 'bg-white/20 text-white' : 'bg-[var(--fitlo-line)] text-[var(--fitlo-ink)]'
            }`}>
              {partnerBookings.length}
            </span>
          </button>
        </div>

        {/* Filter Toolbar for Treatments */}
        {activeSubTab === 'treatments' && partners.length > 0 && (
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-[var(--fitlo-muted)] font-medium flex items-center gap-1">
                <Filter size={12} />
                Partner:
              </span>
              <select
                value={selectedPartnerFilter}
                onChange={(e) => setSelectedPartnerFilter(e.target.value)}
                className="fitlo-select text-xs py-1 px-2.5 h-8 font-semibold"
              >
                <option value="all">
                  All Partners ({treatments.length})
                </option>
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

            {/* Category Filter including Couple Package */}
            <div className="flex items-center gap-1.5">
              <span className="text-[var(--fitlo-muted)] font-medium flex items-center gap-1">
                <Tag size={12} />
                Category:
              </span>
              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="fitlo-select text-xs py-1 px-2.5 h-8 font-semibold"
              >
                <option value="all">All Categories ({treatments.length})</option>
                <option value="Couple Package">
                  Couple Package ({treatments.filter(t => (t.category || '').toLowerCase().includes('couple') || /couple|honeymoon|duo/i.test(t.title || '')).length})
                </option>
                {CATEGORIES.filter(c => c !== 'Couple Package').map(c => {
                  const count = treatments.filter(t => (t.category || '').toLowerCase() === c.toLowerCase()).length;
                  return (
                    <option key={c} value={c}>
                      {c} ({count})
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        )}

        {/* Filter by Partner Spa for Calendar */}
        {activeSubTab === 'calendar' && partners.length > 0 && (
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
              <option value="all">
                All Partners ({partnerBookings.length})
              </option>
              {partners.map(p => {
                const count = partnerBookings.filter(b => b.items?.some((i: any) => i.partnerName === p.name || i.partnerId === p.id)).length;
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
      ) : activeSubTab === 'treatments' ? (

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
          <div className="space-y-4">
            {/* Quick Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedCategoryFilter('all')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  selectedCategoryFilter === 'all'
                    ? 'bg-[var(--fitlo-ink)] text-white'
                    : 'bg-[var(--fitlo-surface)] hover:bg-[var(--fitlo-line)] text-[var(--fitlo-muted)]'
                }`}
              >
                All ({treatments.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategoryFilter('Couple Package')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  selectedCategoryFilter === 'Couple Package'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                }`}
              >
                <span>Couple Package</span>
                <span className="text-[10px] opacity-80">
                  ({treatments.filter(t => (t.category || '').toLowerCase().includes('couple') || /couple|honeymoon|duo/i.test(t.title || '')).length})
                </span>
              </button>
              {CATEGORIES.filter(c => c !== 'Couple Package').map(c => {
                const count = treatments.filter(t => (t.category || '').toLowerCase() === c.toLowerCase()).length;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSelectedCategoryFilter(c)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      selectedCategoryFilter === c
                        ? 'bg-[var(--fitlo-ink)] text-white'
                        : 'bg-[var(--fitlo-surface)] hover:bg-[var(--fitlo-line)] text-[var(--fitlo-muted)]'
                    }`}
                  >
                    {c} ({count})
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTreatments.map((treatment) => {
              const opts = treatment.options || [];
              const firstOpt = opts[0] || { duration: '60', price: '450,000' };
              const originalPrice = parseInt(String(firstOpt.price).replace(/[^0-9]/g, '') || '0', 10);
              const discountRate = Number(treatment.partner_discount_percentage) || 0;
              const taxRate = Number(treatment.partner_tax_percentage) || 0;
              const isCouplePkg = (treatment.category || '').toLowerCase().includes('couple') || /couple|honeymoon|duo/i.test(treatment.title || '');

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
                      <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5">
                        <span className="px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md text-white text-[9px] font-bold tracking-wider uppercase">
                          {treatment.category}
                        </span>
                        {isCouplePkg && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[8px] font-black tracking-wider uppercase">
                            2 Persons
                          </span>
                        )}
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
                        <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--fitlo-muted)] block">
                          Customer Rate {isCouplePkg ? '(For 2 Persons)' : ''}
                        </span>
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
                          <span className="text-[9px] text-[var(--fitlo-muted)] font-medium block">
                            incl. {taxRate}% tax
                          </span>
                        )}
                        {(() => {
                          const optNet = (firstOpt as any).net_price ? parseInt(String((firstOpt as any).net_price).replace(/[^0-9]/g, '') || '0', 10) : 0;
                          const cardProfit = optNet > 0 ? (finalWithTax - optNet) : 0;
                          if (!optNet) return null;
                          return (
                            <div className="flex items-center gap-1.5 text-[10px] mt-1 pt-1 border-t border-[var(--fitlo-line)]">
                              <span className="text-amber-700 font-medium">Net: IDR {optNet.toLocaleString('en-US')}</span>
                              <span className="text-[var(--fitlo-muted)]">·</span>
                              <span className="text-emerald-700 font-bold">Profit: +IDR {cardProfit.toLocaleString('en-US')}</span>
                            </div>
                          );
                        })()}
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
          </div>
        )
      ) : (

        /* ─────────────────────────────────────────────────────────────────────────────
           TAB 3: PARTNER BOOKINGS CALENDAR VIEW
           ───────────────────────────────────────────────────────────────────────────── */
        <div className="space-y-6 animate-in fade-in duration-150">

          {/* Month Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="card p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--fitlo-muted)] block">Month Bookings</span>
                <span className="text-xl font-bold text-[var(--fitlo-ink)] mt-0.5 block">
                  {currentMonthBookings.length} {currentMonthBookings.length === 1 ? 'Booking' : 'Bookings'}
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[var(--fitlo-surface)] text-[var(--fitlo-ink)] flex items-center justify-center font-bold shrink-0">
                <CalendarIcon size={18} />
              </div>
            </div>

            <div className="card p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--fitlo-muted)] block">Gross Revenue</span>
                <span className="text-xl font-bold text-[var(--fitlo-ink)] mt-0.5 block">
                  IDR {monthStats.rev.toLocaleString('en-US')}
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
                <DollarSign size={18} />
              </div>
            </div>

            <div className="card p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">Partner Net Cost</span>
                <span className="text-xl font-bold text-amber-800 mt-0.5 block">
                  {monthStats.net > 0 ? `IDR ${monthStats.net.toLocaleString('en-US')}` : 'IDR 0'}
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0">
                <Receipt size={18} />
              </div>
            </div>

            <div className="card p-4 flex items-center justify-between bg-emerald-50/50 border-emerald-200">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block flex items-center gap-1">
                  <Sparkles size={11} className="text-emerald-600" />
                  Estimated Net Profit
                </span>
                <span className="text-xl font-black text-emerald-700 mt-0.5 block">
                  {monthStats.prof > 0 ? `+IDR ${monthStats.prof.toLocaleString('en-US')}` : `IDR 0`}
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0">
                <DollarSign size={18} />
              </div>
            </div>
          </div>

          {/* Calendar Month Grid */}
          <div className="card p-5 space-y-4">
            {/* Calendar Controls & Month Header */}
            <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-[var(--fitlo-line)]">
              <div className="flex items-center gap-3">
                <h3 className="font-serif text-lg font-bold text-[var(--fitlo-ink)]">
                  {calendarMonthName}
                </h3>
                <span className="text-xs text-[var(--fitlo-muted)]">
                  ({currentMonthBookings.length} reservations this month)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTodayMonth}
                  className="fitlo-btn fitlo-btn--secondary text-xs py-1 px-3"
                >
                  Today
                </button>
                <div className="flex items-center rounded-xl border border-[var(--fitlo-line)] bg-[var(--fitlo-surface)] p-0.5">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="p-1 rounded-lg hover:bg-white text-[var(--fitlo-muted)] hover:text-[var(--fitlo-ink)] transition-colors"
                    title="Previous Month"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="p-1 rounded-lg hover:bg-white text-[var(--fitlo-muted)] hover:text-[var(--fitlo-ink)] transition-colors"
                    title="Next Month"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold uppercase tracking-wider text-[var(--fitlo-muted)] pb-1">
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Sun</span>
            </div>

            {/* Calendar Days Matrix */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {calendarDays.map((day, idx) => {
                const dayBookings = bookingsByDate.get(day.dateStr) || [];
                const isSelected = selectedCalendarDate === day.dateStr;

                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedCalendarDate(day.dateStr)}
                    className={`min-h-[90px] sm:min-h-[110px] p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-[var(--fitlo-ink)] ring-2 ring-[var(--fitlo-ink)]/10 bg-black/[0.02]'
                        : 'border-[var(--fitlo-line)] hover:border-[var(--fitlo-muted)] bg-[var(--fitlo-card)]'
                    } ${!day.isCurrentMonth ? 'opacity-35 bg-[var(--fitlo-surface)]/50' : ''}`}
                  >
                    {/* Top Row: Date Number & Badges */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                          day.isToday
                            ? 'bg-[var(--fitlo-ink)] text-[var(--fitlo-card)] shadow-xs'
                            : isSelected
                            ? 'bg-[var(--fitlo-line)] text-[var(--fitlo-ink)]'
                            : 'text-[var(--fitlo-ink)]'
                        }`}
                      >
                        {day.dayNum}
                      </span>

                      {dayBookings.length > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
                          {dayBookings.length}
                        </span>
                      )}
                    </div>

                    {/* Bookings Chips List */}
                    <div className="space-y-1 mt-1 overflow-hidden">
                      {dayBookings.slice(0, 2).map((b: any, bIdx: number) => {
                        const guest = b.guest_name || 'Guest';
                        const time = b.time || '';
                        return (
                          <div
                            key={bIdx}
                            className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200/60 text-emerald-900 truncate flex items-center gap-1"
                            title={`${time ? time + ' · ' : ''}${guest}`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                            <span className="truncate">{time ? `${time} ` : ''}{guest}</span>
                          </div>
                        );
                      })}
                      {dayBookings.length > 2 && (
                        <span className="text-[9px] font-bold text-[var(--fitlo-muted)] block pl-1">
                          +{dayBookings.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Date Bookings Schedule Drawer */}
          <div className="card p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--fitlo-line)] flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[var(--fitlo-surface)] text-[var(--fitlo-ink)] flex items-center justify-center">
                  <Clock size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[var(--fitlo-ink)]">
                    Schedule for {new Date(selectedCalendarDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </h3>
                  <p className="text-xs text-[var(--fitlo-muted)]">
                    {selectedDateBookings.length} {selectedDateBookings.length === 1 ? 'reservation' : 'reservations'} scheduled
                  </p>
                </div>
              </div>

              {selectedDateBookings.length > 0 && (
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800">
                  {selectedDateBookings.length} Active Booking{selectedDateBookings.length > 1 ? 's' : ''}
                </span>
              )}
            </div>

            {selectedDateBookings.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <p className="text-xs text-[var(--fitlo-muted)]">
                  No partner spa bookings scheduled for this date.
                </p>

                {/* Show quick upcoming list */}
                {filteredCalendarBookings.length > 0 && (
                  <div className="pt-4 max-w-lg mx-auto text-left">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--fitlo-muted)] block mb-2">
                      All Upcoming Partner Reservations
                    </span>
                    <div className="space-y-2">
                      {filteredCalendarBookings.slice(0, 3).map((b: any) => {
                        const bDate = getBookingDate(b);
                        const partner = b.items?.[0]?.partnerName || 'Partner Spa';
                        return (
                          <div
                            key={b.id}
                            onClick={() => setSelectedCalendarDate(bDate)}
                            className="p-3 rounded-xl border border-[var(--fitlo-line)] hover:border-[var(--fitlo-accent)] bg-[var(--fitlo-surface)]/60 cursor-pointer flex items-center justify-between text-xs transition-colors"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="font-mono font-bold text-[10px] bg-black/5 px-2 py-0.5 rounded">
                                {b.reference_number || b.id.slice(0, 6).toUpperCase()}
                              </span>
                              <span className="font-bold text-[var(--fitlo-ink)]">{b.guest_name || 'Guest'}</span>
                              <span className="text-[var(--fitlo-muted)]">·</span>
                              <span className="text-[var(--fitlo-muted)]">{partner}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-[var(--fitlo-ink)]">
                                {bDate} {b.time ? `at ${b.time}` : ''}
                              </span>
                              <span className="text-[10px] text-[var(--fitlo-accent)] font-bold">Select &rarr;</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {selectedDateBookings.map((b: any) => {
                  const item = b.items?.[0] || {};
                  const partnerName = item.partnerName || b.venue || 'Partner Spa';
                  const cleanPhone = (b.guest_whatsapp || '').replace(/[^0-9]/g, '');
                  const invoiceUrl = `/invoice/${b.reference_number || b.id}`;
                  const fin = getBookingFinancials(b);

                  return (
                    <div
                      key={b.id}
                      className="p-5 rounded-2xl border border-[var(--fitlo-line)] bg-[var(--fitlo-card)] hover:border-[var(--fitlo-accent)] transition-all space-y-4 shadow-xs"
                    >
                      {/* Top Header */}
                      <div className="flex items-center justify-between pb-3 border-b border-[var(--fitlo-line)]">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold bg-black/5 text-[var(--fitlo-ink)] px-2.5 py-1 rounded-lg">
                            {b.reference_number || b.id.slice(0, 8).toUpperCase()}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 size={11} />
                            {b.treatment_status || b.status || 'Confirmed'}
                          </span>
                        </div>

                        {b.time && (
                          <div className="flex items-center gap-1 text-xs font-bold text-[var(--fitlo-ink)] bg-[var(--fitlo-surface)] px-2.5 py-1 rounded-lg">
                            <Clock size={12} className="text-[var(--fitlo-muted)]" />
                            <span>{b.time}</span>
                          </div>
                        )}
                      </div>

                      {/* Guest & Venue Details */}
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[var(--fitlo-muted)] flex items-center gap-1.5 font-medium">
                            <User size={13} className="text-gray-400" /> Guest Name
                          </span>
                          <span className="font-bold text-[var(--fitlo-ink)]">{b.guest_name || 'Guest'}</span>
                        </div>

                        {b.guest_whatsapp && (
                          <div className="flex items-center justify-between">
                            <span className="text-[var(--fitlo-muted)] flex items-center gap-1.5 font-medium">
                              <Phone size={13} className="text-gray-400" /> WhatsApp
                            </span>
                            <a
                              href={`https://wa.me/${cleanPhone}`}
                              target="_blank"
                              rel="noreferrer"
                              className="font-bold text-emerald-700 hover:underline flex items-center gap-1"
                            >
                              <span>{b.guest_whatsapp}</span>
                              <ExternalLink size={10} />
                            </a>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <span className="text-[var(--fitlo-muted)] flex items-center gap-1.5 font-medium">
                            <Building2 size={13} className="text-gray-400" /> Partner Venue
                          </span>
                          <span className="font-bold text-[var(--fitlo-ink)] text-right">{partnerName}</span>
                        </div>

                        {b.location && (
                          <div className="flex items-center justify-between">
                            <span className="text-[var(--fitlo-muted)] flex items-center gap-1.5 font-medium">
                              <MapPin size={13} className="text-gray-400" /> Staying At
                            </span>
                            <span className="font-bold text-[var(--fitlo-ink)] text-right">{b.location}</span>
                          </div>
                        )}
                      </div>

                      {/* Treatment Info */}
                      <div className="p-3 rounded-xl bg-[var(--fitlo-surface)] border border-[var(--fitlo-line)] space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--fitlo-muted)] block">
                          Treatment
                        </span>
                        <p className="font-bold text-xs text-[var(--fitlo-ink)]">
                          {item.title || b.treatment_name || 'Spa Treatment'}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-[var(--fitlo-muted)] pt-0.5">
                          {item.duration && <span>{String(item.duration).replace(/mins?/gi, '').trim()} Mins</span>}
                          <span>•</span>
                          <span>{item.guests || b.pax || 1} {Number(item.guests || b.pax || 1) > 1 ? 'Guests' : 'Guest'}</span>
                        </div>
                      </div>

                      {/* Price & Actions with Profit Calculation */}
                      <div className="pt-3 border-t border-[var(--fitlo-line)] flex items-center justify-between gap-3 flex-wrap">
                        <div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--fitlo-muted)]">Customer:</span>
                            <span className="font-serif text-sm font-bold text-[var(--fitlo-ink)]">
                              IDR {fin.totalRev.toLocaleString('en-US')}
                            </span>
                          </div>
                          {fin.netPerPerson > 0 ? (
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className="text-[10px] text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                Net: IDR {fin.totalNetCost.toLocaleString('en-US')} ({fin.pax} pax)
                              </span>
                              <span className="text-[10px] font-black text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded border border-emerald-300">
                                Profit: +IDR {fin.profit.toLocaleString('en-US')}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[9px] text-[var(--fitlo-muted)] italic block mt-0.5">
                              Net price not set in treatment
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <a
                            href={invoiceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="fitlo-btn fitlo-btn--secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
                          >
                            <ExternalLink size={12} />
                            <span>View Invoice</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
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
                  {treatmentForm.category === 'Couple Package' && (
                    <div className="mt-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                      <p className="font-bold flex items-center gap-1 text-amber-900">
                        <span>✨ Couple Package Pricing Rule</span>
                      </p>
                      <p className="mt-0.5 text-amber-800">
                        The price you set below is <strong>already for 2 persons</strong>. The booking system and WhatsApp invoice will never double or multiply this rate.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Description / Experience Overview */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--fitlo-ink)]">
                    Description / Highlights
                  </label>
                  <span className="text-[10px] text-[var(--fitlo-muted)]">General experience overview</span>
                </div>
                <textarea
                  rows={3}
                  placeholder="Indulge in a luxurious head-to-toe spa experience featuring a synchronized four-hands massage, rejuvenating body scrub, relaxing bubble bath, refreshing facial, and nourishing creambath..."
                  value={treatmentForm.experience_desc}
                  onChange={e => setTreatmentForm({ ...treatmentForm, experience_desc: e.target.value })}
                  className="fitlo-input w-full text-xs resize-none"
                />
              </div>

              {/* Treatment Inclusions (Step-by-Step Breakdown) */}
              <div className="space-y-2.5 pt-2 border-t border-[var(--fitlo-line)]">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--fitlo-ink)] flex items-center gap-1.5">
                      <span>Treatment Inclusions</span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        {treatmentForm.inclusions.filter(i => i.name.trim()).length} Steps Included
                      </span>
                    </label>
                    <span className="text-[10px] text-[var(--fitlo-muted)]">
                      Always formatted with bold titles and duration badges on website pop-up (like first listing).
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTreatmentForm({
                      ...treatmentForm,
                      inclusions: [...treatmentForm.inclusions, { name: '', duration: '45' }]
                    })}
                    className="fitlo-btn fitlo-btn--secondary text-[11px] py-1 px-2.5 flex items-center gap-1"
                  >
                    <Plus size={12} />
                    <span>Add Step</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {treatmentForm.inclusions.map((inc, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 rounded-xl bg-[var(--fitlo-surface)] border border-[var(--fitlo-line)]">
                      <div className="w-5 h-5 rounded-md bg-black text-white flex items-center justify-center font-bold text-[9px] shrink-0">
                        {idx + 1}
                      </div>
                      <input
                        type="text"
                        placeholder="e.g. Synchronicity Massage (Four-Hands Massage)"
                        value={inc.name}
                        onChange={e => {
                          const updated = [...treatmentForm.inclusions];
                          updated[idx] = { ...updated[idx], name: e.target.value };
                          setTreatmentForm({ ...treatmentForm, inclusions: updated });
                        }}
                        className="fitlo-input flex-1 text-xs py-1.5"
                      />
                      <div className="flex items-center gap-1 w-24 shrink-0">
                        <input
                          type="text"
                          placeholder="60"
                          value={inc.duration}
                          onChange={e => {
                            const updated = [...treatmentForm.inclusions];
                            updated[idx] = { ...updated[idx], duration: e.target.value.replace(/[^0-9]/g, '') };
                            setTreatmentForm({ ...treatmentForm, inclusions: updated });
                          }}
                          className="fitlo-input w-14 text-xs py-1.5 text-center font-bold"
                        />
                        <span className="text-[10px] font-bold text-gray-500 uppercase">Mins</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = treatmentForm.inclusions.filter((_, i) => i !== idx);
                          setTreatmentForm({ ...treatmentForm, inclusions: updated.length > 0 ? updated : [{ name: '', duration: '' }] });
                        }}
                        className="p-1.5 text-gray-400 hover:text-rose-500 transition-colors"
                        title="Remove step"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>

                {treatmentForm.inclusions.some(i => i.name.trim() && i.duration) && (
                  <div className="flex items-center justify-between text-[11px] font-medium text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200/60">
                    <span>Total Inclusions Breakdown Duration:</span>
                    <span className="font-bold text-gray-900">
                      {treatmentForm.inclusions.reduce((sum, item) => sum + (parseInt(item.duration, 10) || 0), 0)} Mins
                    </span>
                  </div>
                )}
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
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--fitlo-ink)] flex items-center gap-1.5">
                      <span>Duration, Base Price &amp; Net Cost (IDR)</span>
                      {treatmentForm.category === 'Couple Package' && (
                        <span className="text-[10px] text-amber-700 font-bold bg-amber-100/70 px-2 py-0.5 rounded-full border border-amber-300">
                          Total Rate for 2 Persons
                        </span>
                      )}
                    </label>
                    <span className="text-[10px] text-[var(--fitlo-muted)]">
                      Net price is strictly internal for profit calculations and will not be displayed on the website.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={addOptionRow}
                    className="text-xs font-bold text-[var(--fitlo-accent)] hover:underline flex items-center gap-1 shrink-0"
                  >
                    <Plus size={13} />
                    <span>Add Duration</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {treatmentForm.options.map((opt, idx) => {
                    const basePriceNum = parseInt(String(opt.price).replace(/[^0-9]/g, '') || '0', 10);
                    const netPriceNum = parseInt(String(opt.net_price || '').replace(/[^0-9]/g, '') || '0', 10);
                    const partnerDiscount = Number(modalSelectedPartner?.discount_percentage) || 0;
                    const partnerTax = Number(modalSelectedPartner?.tax_percentage) || 0;
                    const discounted = partnerDiscount > 0 ? Math.round(basePriceNum * (1 - partnerDiscount / 100)) : basePriceNum;
                    const finalCustomerPay = partnerTax > 0 ? Math.round(discounted * (1 + partnerTax / 100)) : discounted;
                    const estProfit = finalCustomerPay - netPriceNum;

                    return (
                      <div key={idx} className="p-3 rounded-xl bg-[var(--fitlo-surface)] border border-[var(--fitlo-line)] flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1">
                          {/* Duration in Mins */}
                          <div>
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

                          {/* Base Price (Customer Published) */}
                          <div>
                            <input
                              type="text"
                              required
                              placeholder="e.g. 450,000"
                              value={opt.price}
                              onChange={e => updateOptionRow(idx, 'price', e.target.value)}
                              className="fitlo-input w-full text-xs font-bold"
                            />
                            <span className="text-[9px] text-[var(--fitlo-muted)] block mt-0.5">Base IDR (Published)</span>
                          </div>

                          {/* Net Price Per Person (Internal Cost) */}
                          <div>
                            <input
                              type="text"
                              placeholder="e.g. 300,000"
                              value={opt.net_price || ''}
                              onChange={e => updateOptionRow(idx, 'net_price', e.target.value)}
                              className="fitlo-input w-full text-xs font-bold border-amber-300 bg-amber-50/40 text-amber-900 focus:border-amber-500"
                            />
                            <span className="text-[9px] text-amber-700 font-semibold block mt-0.5 flex items-center justify-between">
                              <span>Net IDR / person</span>
                              <span className="text-[8px] text-[var(--fitlo-muted)]">(internal)</span>
                            </span>
                          </div>
                        </div>

                        {/* Live calculation box */}
                        <div className="md:w-52 text-right px-2.5 border-t md:border-t-0 md:border-l border-[var(--fitlo-line)] pt-2 md:pt-0 shrink-0">
                          <div className="flex justify-between items-baseline gap-2">
                            <span className="text-[9px] uppercase font-bold tracking-wider text-[var(--fitlo-muted)]">Customer:</span>
                            <span className="text-xs font-black text-emerald-600">
                              IDR {finalCustomerPay.toLocaleString('en-US')}
                            </span>
                          </div>
                          {netPriceNum > 0 && (
                            <div className="flex justify-between items-baseline gap-2 mt-0.5">
                              <span className="text-[9px] uppercase font-bold tracking-wider text-amber-700">Net Cost:</span>
                              <span className="text-[11px] font-bold text-amber-800">
                                IDR {netPriceNum.toLocaleString('en-US')}
                              </span>
                            </div>
                          )}
                          {netPriceNum > 0 && (
                            <div className="flex justify-between items-baseline gap-2 border-t border-[var(--fitlo-line)] pt-0.5 mt-0.5">
                              <span className="text-[9px] uppercase font-bold tracking-wider text-[var(--fitlo-ink)]">Est. Profit:</span>
                              <span className={`text-[11px] font-black ${estProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                                {estProfit >= 0 ? '+' : ''}IDR {estProfit.toLocaleString('en-US')}
                              </span>
                            </div>
                          )}
                          {(partnerDiscount > 0 || partnerTax > 0) && (
                            <span className="text-[8px] text-[var(--fitlo-muted)] block mt-0.5">
                              {partnerDiscount > 0 ? `-${partnerDiscount}% off` : ''} {partnerTax > 0 ? `+${partnerTax}% tax` : ''}
                            </span>
                          )}
                        </div>

                        {treatmentForm.options.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeOptionRow(idx)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 self-end md:self-center shrink-0"
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
