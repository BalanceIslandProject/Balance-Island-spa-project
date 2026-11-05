'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Plus, Copy, Check, Eye, ExternalLink, X, 
  Trash2, Star, Sparkles, RefreshCw, CheckCircle2,
  Calendar, Layers, Tag
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useSpa, Campaign, sortCampaigns, DEFAULT_CAMPAIGNS } from '@/context/SpaContext';
import { useTherapickAdmin } from '@/context/TherapickAdminContext';

interface DiscountCodeItem {
  id: string;
  code: string;
  kind: 'pct' | 'fixed' | 'ship';
  value: number;
  uses: number;
  limit: number;
  ends: string; // ISO date or date string
  active: boolean;
  note: string;
}

const DEFAULT_DISCOUNTS: DiscountCodeItem[] = [
  {
    id: 'd1',
    code: 'WELCOME15',
    kind: 'pct',
    value: 15,
    uses: 412,
    limit: 1000,
    ends: '2026-12-30',
    active: true,
    note: 'First order, any in-villa treatment'
  },
  {
    id: 'd2',
    code: 'LAYERS20',
    kind: 'pct',
    value: 20,
    uses: 187,
    limit: 300,
    ends: '2026-11-08',
    active: true,
    note: 'Signature flower bath & massage edit'
  },
  {
    id: 'd3',
    code: 'FREESHIP',
    kind: 'ship',
    value: 0,
    uses: 266,
    limit: 500,
    ends: '2026-11-29',
    active: true,
    note: 'Free villa therapist travel across Bali'
  },
  {
    id: 'd4',
    code: 'FIT10',
    kind: 'fixed',
    value: 100000,
    uses: 58,
    limit: 400,
    ends: '2026-12-14',
    active: true,
    note: 'Rp 100k off after ritual assessment'
  },
  {
    id: 'd5',
    code: 'SUMMER30',
    kind: 'pct',
    value: 30,
    uses: 300,
    limit: 300,
    ends: '2026-09-08',
    active: false,
    note: 'Summer clear-out (ended)'
  }
];

export default function TherapickCampaignsView() {
  const { treatments } = useTherapickAdmin();
  const { campaigns: spaCampaigns, setCampaigns: setSpaCampaigns, setCampaign: setSpaCampaign } = useSpa();

  // Active Sub-tab: 'discounts' | 'banners'
  const [subTab, setSubTab] = useState<'discounts' | 'banners'>('discounts');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Discount Codes state
  const [discounts, setDiscounts] = useState<DiscountCodeItem[]>(DEFAULT_DISCOUNTS);
  const [loadingDiscounts, setLoadingDiscounts] = useState(true);

  // Storefront Banners state
  const [banners, setBanners] = useState<Campaign[]>([]);
  const [loadingBanners, setLoadingBanners] = useState(true);

  // Modals state
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<DiscountCodeItem | null>(null);
  const [codeForm, setCodeForm] = useState({
    code: '',
    kind: 'pct' as 'pct' | 'fixed' | 'ship',
    value: '15',
    limit: '500',
    days: '30',
    note: '',
    active: true
  });

  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Campaign | null>(null);
  const [bannerForm, setBannerForm] = useState({
    title: '',
    description: '',
    label: '',
    discountPercentage: 10,
    startDate: '',
    endDate: '',
    duration: '1_month',
    image: '',
    active: true,
    selectedTreatments: [] as any[]
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const copyCode = (code: string) => {
    try {
      navigator.clipboard?.writeText(code);
    } catch {}
    setCopiedCode(code);
    showToast(`${code} copied`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const triggerRevalidation = async () => {
    try {
      await fetch('/api/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'revalidate' })
      });
    } catch (e) {
      console.warn('Revalidation note:', e);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. FETCH DISCOUNT CODES
  // ─────────────────────────────────────────────────────────────────────────────
  const fetchDiscounts = useCallback(async () => {
    setLoadingDiscounts(true);
    try {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('brand', 'therapick')
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        const mapped: DiscountCodeItem[] = data.map((d: any) => ({
          id: d.id,
          code: d.code,
          kind: d.discount_type === 'fixed' ? 'fixed' : d.discount_type === 'ship' ? 'ship' : 'pct',
          value: Number(d.discount_value) || 0,
          uses: Number(d.current_uses) || 0,
          limit: Number(d.max_uses) || 500,
          ends: d.ends_at || '2026-12-31',
          active: d.is_active !== false,
          note: d.description || `${d.discount_value}% off in-villa booking`
        }));
        setDiscounts(mapped);
      } else {
        setDiscounts(DEFAULT_DISCOUNTS);
      }
    } catch (e) {
      console.error('Error fetching promo codes:', e);
    } finally {
      setLoadingDiscounts(false);
    }
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. FETCH STOREFRONT BANNERS
  // ─────────────────────────────────────────────────────────────────────────────
  const fetchBanners = useCallback(async () => {
    setLoadingBanners(true);
    try {
      let { data } = await supabase
        .from('campaigns')
        .select('*')
        .eq('brand', 'therapick')
        .order('order', { ascending: true });

      if (!data || data.length === 0) {
        if (spaCampaigns && spaCampaigns.length > 0) {
          data = spaCampaigns;
        } else {
          data = DEFAULT_CAMPAIGNS;
        }
      }

      if (data && data.length > 0) {
        const sorted = sortCampaigns(data);
        setBanners(sorted);
      }
    } catch (e) {
      console.error('Error fetching banners:', e);
    } finally {
      setLoadingBanners(false);
    }
  }, [spaCampaigns]);

  useEffect(() => {
    fetchDiscounts();
    fetchBanners();
  }, [fetchDiscounts, fetchBanners]);

  // ─────────────────────────────────────────────────────────────────────────────
  // DISCOUNT CODE HANDLERS
  // ─────────────────────────────────────────────────────────────────────────────
  const toggleCodeActive = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const target = discounts.find(d => d.id === id);
    if (!target) return;
    const nextActive = !target.active;

    setDiscounts(prev => prev.map(d => d.id === id ? { ...d, active: nextActive } : d));
    showToast(nextActive ? `${target.code} works in the bag again` : `${target.code} paused — stops working in the bag`);

    try {
      await supabase.from('promo_codes').update({ is_active: nextActive }).eq('id', id);
    } catch (err) {
      console.warn('Update promo error:', err);
    }
  };

  const openNewCodeModal = () => {
    setEditingCode(null);
    setCodeForm({
      code: '',
      kind: 'pct',
      value: '15',
      limit: '500',
      days: '30',
      note: 'First order, any in-villa treatment',
      active: true
    });
    setIsCodeModalOpen(true);
  };

  const openEditCodeModal = (item: DiscountCodeItem) => {
    setEditingCode(item);
    setCodeForm({
      code: item.code,
      kind: item.kind,
      value: String(item.value),
      limit: String(item.limit),
      days: '30',
      note: item.note,
      active: item.active
    });
    setIsCodeModalOpen(true);
  };

  const handleSaveCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = codeForm.code.trim().toUpperCase();
    if (!cleanCode) return;

    const endDate = new Date(Date.now() + (Number(codeForm.days) || 30) * 86400000).toISOString().split('T')[0];

    const newDiscount: DiscountCodeItem = {
      id: editingCode ? editingCode.id : `d${Date.now()}`,
      code: cleanCode,
      kind: codeForm.kind,
      value: codeForm.kind === 'ship' ? 0 : Number(codeForm.value) || 0,
      uses: editingCode ? editingCode.uses : 0,
      limit: Number(codeForm.limit) || 500,
      ends: endDate,
      active: codeForm.active,
      note: codeForm.note.trim() || (codeForm.kind === 'pct' ? `${codeForm.value}% off` : codeForm.kind === 'fixed' ? `Rp ${codeForm.value} off` : 'Free villa transport')
    };

    if (editingCode) {
      setDiscounts(prev => prev.map(d => d.id === editingCode.id ? newDiscount : d));
    } else {
      setDiscounts(prev => [newDiscount, ...prev]);
    }

    setIsCodeModalOpen(false);
    showToast(`${cleanCode} is live — try it in the bag`);

    try {
      const record = {
        code: cleanCode,
        discount_type: codeForm.kind === 'fixed' ? 'fixed' : codeForm.kind === 'ship' ? 'ship' : 'percentage',
        discount_value: codeForm.kind === 'ship' ? 0 : Number(codeForm.value) || 0,
        max_uses: Number(codeForm.limit) || 500,
        current_uses: editingCode ? editingCode.uses : 0,
        description: newDiscount.note,
        ends_at: endDate,
        is_active: codeForm.active,
        brand: 'therapick'
      };

      if (editingCode) {
        await supabase.from('promo_codes').update(record).eq('id', editingCode.id);
      } else {
        await supabase.from('promo_codes').insert([{ ...record, id: newDiscount.id }]);
      }
    } catch (err) {
      console.warn('Supabase promo save error:', err);
    }
  };

  const handleDeleteCode = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Delete this discount code?')) return;
    setDiscounts(prev => prev.filter(d => d.id !== id));
    showToast('Discount code deleted');
    try {
      await supabase.from('promo_codes').delete().eq('id', id);
    } catch (err) {
      console.warn('Delete promo error:', err);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // SHOP BANNERS HANDLERS
  // ─────────────────────────────────────────────────────────────────────────────
  const toggleBannerActive = async (banner: Campaign, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const nextActive = banner.is_published === false;
    const updated = banners.map(b => b.id === banner.id ? { ...b, is_published: nextActive } : b);
    setBanners(updated);
    setSpaCampaigns(updated);

    showToast(nextActive ? `"${banner.title}" is on Explore` : `"${banner.title}" is off Explore`);

    try {
      localStorage.setItem('spa_campaigns', JSON.stringify(updated));
      window.dispatchEvent(new Event('spa_campaigns_updated'));
      await supabase.from('campaigns').update({ is_published: nextActive }).eq('id', banner.id);
      await triggerRevalidation();
    } catch (err) {
      console.warn('Banner toggle error:', err);
    }
  };

  const makeBannerHero = async (banner: Campaign, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const without = banners.filter(b => b.id !== banner.id);
    const updated = [{ ...banner, order: 1, is_published: true }, ...without.map((b, i) => ({ ...b, order: i + 2 }))];

    setBanners(updated);
    setSpaCampaigns(updated);
    setSpaCampaign(updated[0]);

    showToast(`"${banner.title}" is now the hero on Explore`);

    try {
      localStorage.setItem('spa_campaigns', JSON.stringify(updated));
      localStorage.setItem('spa_campaign', JSON.stringify(updated[0]));
      window.dispatchEvent(new Event('spa_campaigns_updated'));
      await Promise.all(updated.map(b => supabase.from('campaigns').update({ order: b.order }).eq('id', b.id)));
      await triggerRevalidation();
    } catch (err) {
      console.warn('Hero update error:', err);
    }
  };

  const openEditBannerModal = (b: Campaign) => {
    setEditingBanner(b);
    setBannerForm({
      title: b.title || '',
      description: b.description || '',
      label: b.label || `${b.discountPercentage}% OFF`,
      discountPercentage: b.discountPercentage ?? 10,
      startDate: b.startDate || '',
      endDate: b.endDate || '',
      duration: b.duration || '1_month',
      image: b.image_url || b.image || '',
      active: b.is_published !== false,
      selectedTreatments: b.selectedTreatments || []
    });
    setIsBannerModalOpen(true);
  };

  const openNewBannerModal = () => {
    setEditingBanner(null);
    setBannerForm({
      title: 'New Storefront Banner',
      description: 'Exclusive in-villa spa package delivered straight to your Bali pool deck.',
      label: 'LIMITED 15% OFF',
      discountPercentage: 15,
      startDate: '',
      endDate: '',
      duration: '1_month',
      image: 'https://images.pexels.com/photos/3865712/pexels-photo-3865712.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop&crop=center',
      active: true,
      selectedTreatments: treatments.map(t => ({ treatmentId: t.id, durations: (t.options || []).map(o => o.duration) }))
    });
    setIsBannerModalOpen(true);
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetId = editingBanner?.id || (typeof crypto !== 'undefined' ? crypto.randomUUID() : `b${Date.now()}`);

    const bannerData: Campaign = {
      id: targetId,
      title: bannerForm.title.trim() || 'Storefront Campaign',
      description: bannerForm.description.trim(),
      label: bannerForm.label.trim() || `${bannerForm.discountPercentage}% OFF`,
      discountPercentage: Number(bannerForm.discountPercentage) || 0,
      startDate: bannerForm.startDate || undefined,
      endDate: bannerForm.endDate || undefined,
      duration: bannerForm.duration || '1_month',
      image_url: bannerForm.image || null,
      is_published: bannerForm.active,
      order: editingBanner?.order || (banners.length + 1),
      selectedTreatments: bannerForm.selectedTreatments.length > 0 
        ? bannerForm.selectedTreatments 
        : treatments.map(t => ({ treatmentId: t.id, durations: (t.options || []).map(o => o.duration) })),
      brand: 'therapick'
    } as any;

    let updatedList: Campaign[];
    if (editingBanner) {
      updatedList = banners.map(b => b.id === editingBanner.id ? bannerData : b);
    } else {
      updatedList = [...banners, bannerData];
    }

    const sorted = sortCampaigns(updatedList);
    setBanners(sorted);
    setSpaCampaigns(sorted);
    if (sorted.length > 0) setSpaCampaign(sorted[0]);
    setIsBannerModalOpen(false);
    showToast(`Saved "${bannerData.title}"`);

    try {
      localStorage.setItem('spa_campaigns', JSON.stringify(sorted));
      window.dispatchEvent(new Event('spa_campaigns_updated'));
      if (editingBanner) {
        await supabase.from('campaigns').update(bannerData).eq('id', editingBanner.id);
      } else {
        await supabase.from('campaigns').insert([bannerData]);
      }
      await triggerRevalidation();
    } catch (err) {
      console.warn('Save banner error:', err);
    }
  };

  const handleDeleteBanner = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Delete this storefront campaign banner?')) return;
    const updated = banners.filter(b => b.id !== id);
    setBanners(updated);
    setSpaCampaigns(updated);
    if (updated.length > 0) setSpaCampaign(updated[0]);
    showToast('Banner deleted');
    try {
      localStorage.setItem('spa_campaigns', JSON.stringify(updated));
      window.dispatchEvent(new Event('spa_campaigns_updated'));
      await supabase.from('campaigns').delete().eq('id', id);
      await triggerRevalidation();
    } catch (err) {
      console.warn('Delete banner error:', err);
    }
  };

  // Counts
  const activeDiscountsCount = discounts.filter(d => d.active).length;
  const activeBannersCount = banners.filter(b => b.is_published !== false).length;

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
          <h1 className="fitlo-page-title">Campaigns</h1>
          <p className="fitlo-page-sub">
            {subTab === 'discounts' 
              ? `${activeDiscountsCount} codes live in the bag` 
              : `${activeBannersCount} of ${banners.length} banners on Explore`}
          </p>
        </div>

        <div>
          {subTab === 'discounts' ? (
            <button
              type="button"
              onClick={openNewCodeModal}
              className="fitlo-btn fitlo-btn--primary cursor-pointer"
            >
              <Plus size={16} strokeWidth={2.4} />
              <span>New code</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <a
                href="https://booktherapick.com"
                target="_blank"
                rel="noreferrer"
                className="fitlo-btn fitlo-btn--ghost text-xs"
              >
                <Eye size={14} />
                <span>See Explore</span>
              </a>
              <button
                type="button"
                onClick={openNewBannerModal}
                className="fitlo-btn fitlo-btn--primary cursor-pointer"
              >
                <Plus size={16} strokeWidth={2.4} />
                <span>New banner</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ─── FITLO SUBNAV TABS ─── */}
      <div className="fitlo-tabs">
        <button
          type="button"
          onClick={() => setSubTab('discounts')}
          className={`fitlo-tab-btn ${subTab === 'discounts' ? 'is-active' : ''}`}
        >
          <span>Discount codes</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('banners')}
          className={`fitlo-tab-btn ${subTab === 'banners' ? 'is-active' : ''}`}
        >
          <span>Shop banners</span>
        </button>
      </div>

      {/* ─── TAB 1: DISCOUNT CODES TICKETS GRID ─── */}
      {subTab === 'discounts' && (
        <div className="tickets animate-in fade-in duration-200">
          {discounts.map((item) => {
            const endsDate = item.ends ? new Date(item.ends) : new Date();
            const daysLeft = Math.round((endsDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            const isUsedUp = item.uses >= item.limit;
            const isEnded = daysLeft < 0;
            const isLive = item.active && !isUsedUp && !isEnded;
            const pctUsed = Math.min(100, Math.round((item.uses / Math.max(1, item.limit)) * 100));

            const displayValue = item.kind === 'pct' 
              ? `${item.value}% off` 
              : item.kind === 'ship' 
                ? 'Free delivery' 
                : `Rp ${(item.value / 1000).toLocaleString('id-ID')}k off`;

            return (
              <article 
                key={item.id}
                onClick={() => openEditCodeModal(item)}
                className={`card ticket ${item.active ? '' : 'is-off'} cursor-pointer group`}
              >
                {/* Ticket Top: Code with Copy Button + Active Switch */}
                <div className="ticket__top">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); copyCode(item.code); }}
                    className="ticket__code"
                    title={`Copy code ${item.code}`}
                  >
                    <span>{item.code}</span>
                    {copiedCode === item.code ? (
                      <Check size={14} className="text-[var(--fitlo-accent)] shrink-0" />
                    ) : (
                      <Copy size={13} className="ico shrink-0 opacity-60 group-hover:opacity-100" />
                    )}
                  </button>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={item.active}
                    onClick={(e) => toggleCodeActive(item.id, e)}
                    className={`fitlo-switch ${item.active ? 'is-checked' : ''}`}
                    title={item.active ? 'Pause code' : 'Activate code'}
                  >
                    <i />
                  </button>
                </div>

                {/* Big Ticket Value */}
                <div className="ticket__value">
                  {displayValue}
                </div>

                {/* Subtitle / Note */}
                <p className="text-xs text-[var(--fitlo-muted)] line-clamp-1">
                  {item.note || 'Active promo code'}
                </p>

                {/* Usage Count & Percentage */}
                <div className="ticket__use">
                  <small>{item.uses.toLocaleString()} of {item.limit.toLocaleString()} used</small>
                  <small>{pctUsed}%</small>
                </div>

                {/* Meter Progress Bar */}
                <div className={`fitlo-meter ${isUsedUp ? 'is-bad' : pctUsed > 80 ? 'is-warn' : ''}`}>
                  <i style={{ width: `${pctUsed}%` }} />
                </div>

                {/* Ticket Foot: Status Pill & Expiry */}
                <div className="ticket__foot">
                  {isLive ? (
                    <span className="fitlo-pill fitlo-pill--good text-[11px] py-0.5 px-2">
                      Live
                    </span>
                  ) : isUsedUp ? (
                    <span className="fitlo-pill fitlo-pill--bad text-[11px] py-0.5 px-2">
                      Used up
                    </span>
                  ) : isEnded ? (
                    <span className="fitlo-pill fitlo-pill--info text-[11px] py-0.5 px-2">
                      Ended
                    </span>
                  ) : (
                    <span className="fitlo-pill fitlo-pill--warn text-[11px] py-0.5 px-2">
                      Paused
                    </span>
                  )}

                  <small className="text-[11px] text-[var(--fitlo-muted)] font-medium">
                    {daysLeft >= 0 
                      ? `Ends ${endsDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · ${daysLeft} days` 
                      : `Ended ${endsDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                  </small>
                </div>
              </article>
            );
          })}

          {/* Dotted "+ New code" Card matching screenshot */}
          <button
            type="button"
            onClick={openNewCodeModal}
            className="card ticket ticket--new"
          >
            <Plus size={20} className="mb-1" />
            <b className="text-sm font-bold text-[var(--fitlo-ink)]">New code</b>
            <small className="text-xs text-[var(--fitlo-muted)]">Live in the bag as soon as it’s saved</small>
          </button>
        </div>
      )}

      {/* ─── TAB 2: SHOP BANNERS GRID ─── */}
      {subTab === 'banners' && (
        <div className="banners animate-in fade-in duration-200">
          {banners.map((banner, idx) => {
            const isHero = banner.order === 1 || idx === 0;
            const isLive = banner.is_published !== false;

            return (
              <article 
                key={banner.id || idx}
                className={`card bancard ${isLive ? '' : 'is-off'}`}
              >
                {/* 16:9 Picture with Tint & Hero Tag */}
                <div className="bancard__pic">
                  <img 
                    src={banner.image_url || banner.image || 'https://images.pexels.com/photos/3865712/pexels-photo-3865712.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop&crop=center'} 
                    alt={banner.title} 
                  />
                  {isHero && isLive && (
                    <span className="pcard__tag">Hero</span>
                  )}
                </div>

                {/* Body */}
                <div className="bancard__body">
                  <div className="bancard__top">
                    <div className="cell__text">
                      <b>{banner.title}</b>
                      <small>{banner.description || 'In-villa signature treatment package'}</small>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={isLive}
                      onClick={(e) => toggleBannerActive(banner, e)}
                      className={`fitlo-switch ${isLive ? 'is-checked' : ''}`}
                      title={isLive ? 'Hide banner' : 'Publish banner'}
                    >
                      <i />
                    </button>
                  </div>

                  {/* Stats Strip */}
                  <div className="bancard__stats">
                    <div>
                      <small>Discount</small>
                      <b>{banner.discountPercentage || 10}%</b>
                    </div>
                    <div>
                      <small>Rituals</small>
                      <b>{banner.selectedTreatments?.length || treatments.length}</b>
                    </div>
                    <div>
                      <small>Duration</small>
                      <b className="capitalize text-xs">{banner.duration ? banner.duration.replace('_', ' ') : '1 mo'}</b>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="bancard__actions justify-between">
                    <div className="flex items-center gap-2">
                      {!isHero && (
                        <button
                          type="button"
                          disabled={!isLive}
                          onClick={(e) => makeBannerHero(banner, e)}
                          className="fitlo-btn fitlo-btn--ghost text-xs py-1 px-2.5 disabled:opacity-30 cursor-pointer"
                        >
                          <Star size={12} />
                          <span>Make it the hero</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => openEditBannerModal(banner)}
                        className="fitlo-btn fitlo-btn--ghost text-xs py-1 px-2.5 cursor-pointer"
                      >
                        Edit
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <a
                        href="https://booktherapick.com"
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-[var(--fitlo-muted)] hover:text-[var(--fitlo-ink)] flex items-center gap-1"
                      >
                        <span>Opens booktherapick</span>
                        <ExternalLink size={11} />
                      </a>
                      {banner.id && (
                        <button
                          type="button"
                          onClick={(e) => handleDeleteBanner(banner.id!, e)}
                          className="text-[var(--fitlo-muted)] hover:text-red-500 p-1"
                          title="Delete banner"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}

          {/* Dotted "+ New banner" Card */}
          <button
            type="button"
            onClick={openNewBannerModal}
            className="card ticket ticket--new"
          >
            <Plus size={20} className="mb-1" />
            <b className="text-sm font-bold text-[var(--fitlo-ink)]">New banner</b>
            <small className="text-xs text-[var(--fitlo-muted)]">Live on Explore as soon as it’s saved</small>
          </button>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          MODAL: NEW / EDIT DISCOUNT CODE
          ───────────────────────────────────────────────────────────────────────────── */}
      {isCodeModalOpen && (
        <div className="fitlo-modal-backdrop flex items-center justify-center p-4">
          <div className="fitlo-modal w-full max-w-md p-6 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--fitlo-line)]">
              <div>
                <h3 className="text-base font-bold text-[var(--fitlo-ink)]">
                  {editingCode ? 'Edit discount code' : 'New discount code'}
                </h3>
                <p className="text-xs text-[var(--fitlo-muted)] mt-0.5">
                  Works in the bag the moment it is saved.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCodeModalOpen(false)}
                className="p-1 rounded-lg text-[var(--fitlo-muted)] hover:text-[var(--fitlo-ink)]"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCode} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--fitlo-ink)] mb-1">
                  Code
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. WELCOME15"
                  value={codeForm.code}
                  onChange={e => setCodeForm({ ...codeForm, code: e.target.value.toUpperCase().replace(/\s/g, '') })}
                  className="fitlo-input w-full font-mono uppercase tracking-wider text-sm font-bold"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--fitlo-ink)] mb-1">
                    Gives
                  </label>
                  <select
                    value={codeForm.kind}
                    onChange={e => setCodeForm({ ...codeForm, kind: e.target.value as any })}
                    className="fitlo-select w-full text-xs font-semibold"
                  >
                    <option value="pct">Percentage (% off)</option>
                    <option value="fixed">Fixed Amount (IDR)</option>
                    <option value="ship">Free Villa Transport</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--fitlo-ink)] mb-1">
                    {codeForm.kind === 'pct' ? 'Discount %' : codeForm.kind === 'fixed' ? 'Amount (IDR)' : 'Value'}
                  </label>
                  <input
                    type="number"
                    disabled={codeForm.kind === 'ship'}
                    value={codeForm.kind === 'ship' ? '0' : codeForm.value}
                    onChange={e => setCodeForm({ ...codeForm, value: e.target.value })}
                    className="fitlo-input w-full text-xs"
                    min="0"
                    placeholder="15"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--fitlo-ink)] mb-1">
                    Usage Limit
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={codeForm.limit}
                    onChange={e => setCodeForm({ ...codeForm, limit: e.target.value })}
                    className="fitlo-input w-full text-xs"
                    placeholder="500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--fitlo-ink)] mb-1">
                    Duration (Days)
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={codeForm.days}
                    onChange={e => setCodeForm({ ...codeForm, days: e.target.value })}
                    className="fitlo-input w-full text-xs"
                    placeholder="30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--fitlo-ink)] mb-1">
                  Note / Subtitle
                </label>
                <input
                  type="text"
                  placeholder="e.g. First order, any item"
                  value={codeForm.note}
                  onChange={e => setCodeForm({ ...codeForm, note: e.target.value })}
                  className="fitlo-input w-full text-xs"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-bold text-[var(--fitlo-ink)]">Active in bag immediately</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={codeForm.active}
                  onClick={() => setCodeForm({ ...codeForm, active: !codeForm.active })}
                  className={`fitlo-switch ${codeForm.active ? 'is-checked' : ''}`}
                >
                  <i />
                </button>
              </div>

              <div className="pt-4 border-t border-[var(--fitlo-line)] flex items-center justify-between">
                {editingCode ? (
                  <button
                    type="button"
                    onClick={(e) => { handleDeleteCode(editingCode.id, e); setIsCodeModalOpen(false); }}
                    className="text-xs font-semibold text-red-500 hover:underline"
                  >
                    Delete code
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCodeModalOpen(false)}
                    className="fitlo-btn fitlo-btn--ghost text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="fitlo-btn fitlo-btn--primary text-xs"
                  >
                    <span>{editingCode ? 'Save changes' : 'Save code'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          MODAL: NEW / EDIT SHOP BANNER
          ───────────────────────────────────────────────────────────────────────────── */}
      {isBannerModalOpen && (
        <div className="fitlo-modal-backdrop flex items-center justify-center p-4">
          <div className="fitlo-modal w-full max-w-lg p-6 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--fitlo-line)]">
              <div>
                <h3 className="text-base font-bold text-[var(--fitlo-ink)]">
                  {editingBanner ? 'Edit storefront banner' : 'New storefront banner'}
                </h3>
                <p className="text-xs text-[var(--fitlo-muted)] mt-0.5">
                  Displays on booktherapick.com homepage & Explore.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsBannerModalOpen(false)}
                className="p-1 rounded-lg text-[var(--fitlo-muted)] hover:text-[var(--fitlo-ink)]"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveBanner} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--fitlo-ink)] mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. The layering edit"
                  value={bannerForm.title}
                  onChange={e => setBannerForm({ ...bannerForm, title: e.target.value })}
                  className="fitlo-input w-full text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--fitlo-ink)] mb-1">
                  Subtitle / Highlights
                </label>
                <textarea
                  rows={2}
                  placeholder="Heavy knits, soft fleece and a parka for the cold snap..."
                  value={bannerForm.description}
                  onChange={e => setBannerForm({ ...bannerForm, description: e.target.value })}
                  className="fitlo-input w-full text-xs resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--fitlo-ink)] mb-1">
                    Badge Label
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 15% OFF"
                    value={bannerForm.label}
                    onChange={e => setBannerForm({ ...bannerForm, label: e.target.value })}
                    className="fitlo-input w-full text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--fitlo-ink)] mb-1">
                    Discount %
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={bannerForm.discountPercentage}
                    onChange={e => setBannerForm({ ...bannerForm, discountPercentage: Number(e.target.value) })}
                    className="fitlo-input w-full text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--fitlo-ink)] mb-1">
                  Banner Image URL
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={bannerForm.image}
                  onChange={e => setBannerForm({ ...bannerForm, image: e.target.value })}
                  className="fitlo-input w-full text-xs"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-bold text-[var(--fitlo-ink)]">Publish on storefront immediately</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={bannerForm.active}
                  onClick={() => setBannerForm({ ...bannerForm, active: !bannerForm.active })}
                  className={`fitlo-switch ${bannerForm.active ? 'is-checked' : ''}`}
                >
                  <i />
                </button>
              </div>

              <div className="pt-4 border-t border-[var(--fitlo-line)] flex items-center justify-between">
                {editingBanner?.id ? (
                  <button
                    type="button"
                    onClick={(e) => { handleDeleteBanner(editingBanner.id!, e); setIsBannerModalOpen(false); }}
                    className="text-xs font-semibold text-red-500 hover:underline"
                  >
                    Delete banner
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsBannerModalOpen(false)}
                    className="fitlo-btn fitlo-btn--ghost text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="fitlo-btn fitlo-btn--primary text-xs"
                  >
                    <span>{editingBanner ? 'Save changes' : 'Save banner'}</span>
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
