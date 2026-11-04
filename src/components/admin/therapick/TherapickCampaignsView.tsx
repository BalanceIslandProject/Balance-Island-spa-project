'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Megaphone, Plus, Trash2, ArrowUp, ArrowDown, ArrowRight, Check, 
  CheckCircle2, RefreshCw, Eye, EyeOff, Sparkles, Layers, Calendar, 
  Percent, ExternalLink, Ticket, Search, X, CheckCheck
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useSpa, Campaign, SelectedCampaignTreatment, sortCampaigns, DEFAULT_CAMPAIGNS } from '@/context/SpaContext';
import { useTherapickAdmin } from '@/context/TherapickAdminContext';

interface CampaignFormState {
  title: string;
  label: string;
  description: string;
  discountPercentage: number;
  startDate: string;
  endDate: string;
  duration: string;
  order: number;
  is_published: boolean;
  selectedTreatments: SelectedCampaignTreatment[];
}

const CAMPAIGN_PRESETS = [
  {
    title: "Summer Retreat & Spa Package",
    label: "LIMITED 10% OFF",
    description: "Relax deeply with customized flower baths, traditional Balinese massage, and organic botanical body wraps in the comfort of your villa.",
    discountPercentage: 10,
    duration: "1_month"
  },
  {
    title: "Couples In-Villa Escape",
    label: "SPECIAL 15% OFF",
    description: "Indulge in a tranquil couples journey with aromatherapy massage, foot reflexology, and complimentary herbal wellness teas.",
    discountPercentage: 15,
    duration: "2_weeks"
  },
  {
    title: "Signature Bali Healing Ritual",
    label: "EXCLUSIVE 20% OFF",
    description: "Rejuvenate body and spirit with our master therapists featuring sacred Balinese boreh wrap and deep tissue recovery.",
    discountPercentage: 20,
    duration: "1_month"
  },
  {
    title: "Flash Weekend Special",
    label: "WEEKEND 10% OFF",
    description: "Quick weekend rejuvenation delivered straight to your hotel or villa pool deck anywhere in Bali.",
    discountPercentage: 10,
    duration: "weekend"
  }
];

const generateUUID = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const formatMonth = (dateStr: string) => {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short' });
  } catch {
    return '';
  }
};

const formatDay = (dateStr: string) => {
  try {
    return new Date(dateStr).getDate();
  } catch {
    return '';
  }
};

const formatYear = (dateStr: string) => {
  try {
    return new Date(dateStr).getFullYear();
  } catch {
    return '';
  }
};

export default function TherapickCampaignsView() {
  const { treatments } = useTherapickAdmin();
  const { 
    campaigns: spaCampaigns, 
    setCampaigns: setSpaCampaigns, 
    setCampaign: setSpaCampaign 
  } = useSpa();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [treatmentSearch, setTreatmentSearch] = useState('');

  // Form State
  const [formData, setFormData] = useState<CampaignFormState>({
    title: 'Summer Retreat & Spa Package',
    label: 'LIMITED 10% OFF',
    description: 'Relax deeply with customized flower baths, traditional Balinese massage, and organic botanical body wraps in the comfort of your villa.',
    discountPercentage: 10,
    startDate: '',
    endDate: '',
    duration: '1_month',
    order: 1,
    is_published: true,
    selectedTreatments: []
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
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

  // Fetch campaigns for Therapick
  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch campaigns for therapick brand
      let { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('brand', 'therapick')
        .order('order', { ascending: true });

      // Fallback: If no therapick-specific campaigns exist yet, check general/elexoir or spa context
      if (!data || data.length === 0) {
        const { data: fallbackData } = await supabase
          .from('campaigns')
          .select('*')
          .order('order', { ascending: true });
        
        if (fallbackData && fallbackData.length > 0) {
          data = fallbackData;
        } else if (spaCampaigns && spaCampaigns.length > 0) {
          data = spaCampaigns;
        } else {
          data = DEFAULT_CAMPAIGNS;
        }
      }

      if (data && data.length > 0) {
        const sorted = sortCampaigns(data);
        setCampaigns(sorted);
        loadCampaignToForm(sorted[0]);
      } else {
        setCampaigns([]);
      }
    } catch (err) {
      console.error('Error fetching campaigns:', err);
    } finally {
      setLoading(false);
    }
  }, [spaCampaigns]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  // Load a campaign into the editor
  const loadCampaignToForm = (c: Campaign) => {
    setEditingCampaignId(c.id || null);
    setFormData({
      title: c.title || '',
      label: c.label || '',
      description: c.description || '',
      discountPercentage: c.discountPercentage ?? 10,
      startDate: c.startDate || '',
      endDate: c.endDate || '',
      duration: c.duration || '1_month',
      order: c.order ?? 1,
      is_published: c.is_published !== false,
      selectedTreatments: c.selectedTreatments || []
    });
  };

  // Reset form for a new campaign
  const handleNewCampaign = () => {
    setEditingCampaignId(null);
    setFormData({
      title: 'New Seasonal Campaign',
      label: 'SPECIAL 15% OFF',
      description: 'Experience pure island relaxation with our curated in-villa spa treatments at special promotional rates.',
      discountPercentage: 15,
      startDate: '',
      endDate: '',
      duration: '1_month',
      order: campaigns.length + 1,
      is_published: true,
      selectedTreatments: treatments.map(t => ({
        treatmentId: t.id,
        durations: (t.options || []).map(o => o.duration)
      }))
    });
  };

  // Apply a preset
  const handleApplyPreset = (preset: typeof CAMPAIGN_PRESETS[0]) => {
    setFormData(prev => ({
      ...prev,
      title: preset.title,
      label: preset.label,
      description: preset.description,
      discountPercentage: preset.discountPercentage,
      duration: preset.duration
    }));
    showToast(`Loaded preset: "${preset.title}"`);
  };

  // Treatment selection handlers
  const handleSelectAllTreatments = () => {
    const all = treatments.map(t => ({
      treatmentId: t.id,
      durations: (t.options || []).map(o => o.duration)
    }));
    setFormData(prev => ({ ...prev, selectedTreatments: all }));
  };

  const handleClearAllTreatments = () => {
    setFormData(prev => ({ ...prev, selectedTreatments: [] }));
  };

  const handleToggleTreatmentDuration = (treatmentId: string, duration: string) => {
    setFormData(prev => {
      const existing = prev.selectedTreatments.find(st => st.treatmentId === treatmentId);
      let updated: SelectedCampaignTreatment[];

      if (existing) {
        const hasDuration = existing.durations.includes(duration);
        let nextDurations: string[];
        if (hasDuration) {
          nextDurations = existing.durations.filter(d => d !== duration);
        } else {
          nextDurations = [...existing.durations, duration];
        }

        if (nextDurations.length === 0) {
          updated = prev.selectedTreatments.filter(st => st.treatmentId !== treatmentId);
        } else {
          updated = prev.selectedTreatments.map(st => 
            st.treatmentId === treatmentId ? { ...st, durations: nextDurations } : st
          );
        }
      } else {
        updated = [...prev.selectedTreatments, { treatmentId, durations: [duration] }];
      }

      return { ...prev, selectedTreatments: updated };
    });
  };

  // Reorder campaigns
  const handleMoveCampaign = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= campaigns.length) return;

    const newCampaigns = [...campaigns];
    const [moved] = newCampaigns.splice(index, 1);
    newCampaigns.splice(targetIndex, 0, moved);

    const reordered = newCampaigns.map((c, i) => ({ ...c, order: i + 1 }));
    setCampaigns(reordered);
    setSpaCampaigns(reordered);
    if (reordered.length > 0) {
      setSpaCampaign(reordered[0]);
    }

    try {
      localStorage.setItem('spa_campaigns', JSON.stringify(reordered));
      window.dispatchEvent(new Event('spa_campaigns_updated'));
      await Promise.all(
        reordered.map(item => 
          supabase.from('campaigns').update({ order: item.order }).eq('id', item.id)
        )
      );
      await triggerRevalidation();
    } catch (e) {
      console.error('Failed to update campaign order:', e);
    }
  };

  // Toggle publish / hide
  const handleTogglePublish = async (camp: Campaign) => {
    const newStatus = camp.is_published === false;
    const updated = campaigns.map(c => c.id === camp.id ? { ...c, is_published: newStatus } : c);
    setCampaigns(updated);
    setSpaCampaigns(updated);

    if (editingCampaignId === camp.id) {
      setFormData(prev => ({ ...prev, is_published: newStatus }));
    }

    try {
      localStorage.setItem('spa_campaigns', JSON.stringify(updated));
      window.dispatchEvent(new Event('spa_campaigns_updated'));
      await supabase.from('campaigns').update({ is_published: newStatus }).eq('id', camp.id);
      await triggerRevalidation();
      showToast(newStatus ? 'Campaign is now published on storefront' : 'Campaign hidden from storefront');
    } catch (e) {
      console.error('Failed to toggle publish status:', e);
    }
  };

  // Delete campaign
  const handleDeleteCampaign = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this campaign card?')) return;

    const updated = campaigns.filter(c => c.id !== id);
    setCampaigns(updated);
    setSpaCampaigns(updated);
    if (updated.length > 0) {
      setSpaCampaign(updated[0]);
      if (editingCampaignId === id) {
        loadCampaignToForm(updated[0]);
      }
    } else {
      setSpaCampaign(null);
      handleNewCampaign();
    }

    try {
      localStorage.setItem('spa_campaigns', JSON.stringify(updated));
      window.dispatchEvent(new Event('spa_campaigns_updated'));
      await supabase.from('campaigns').delete().eq('id', id);
      await triggerRevalidation();
      showToast('Campaign card deleted.');
    } catch (e) {
      console.error('Delete error:', e);
    }
  };

  // Save / Update Campaign
  const handleSaveCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const targetId = editingCampaignId || generateUUID();
      const targetOrder = Number(formData.order) || (editingCampaignId ? 1 : campaigns.length + 1);

      const resolvedSelectedTreatments = formData.selectedTreatments.length > 0
        ? formData.selectedTreatments
        : treatments.map(t => ({
            treatmentId: t.id,
            durations: (t.options || []).map(o => o.duration)
          }));

      const campaignRecord: Campaign = {
        id: targetId,
        title: formData.title.trim() || 'Summer Retreat & Spa Package',
        label: formData.label.trim() || `${formData.discountPercentage}% OFF`,
        description: formData.description.trim() || '',
        discountPercentage: Number(formData.discountPercentage) || 0,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
        duration: formData.duration || '1_month',
        selectedTreatments: resolvedSelectedTreatments,
        order: targetOrder,
        is_published: formData.is_published,
        brand: 'therapick'
      } as any;

      let updatedList: Campaign[];
      if (editingCampaignId) {
        updatedList = campaigns.map(c => c.id === editingCampaignId ? campaignRecord : c);
      } else {
        updatedList = [...campaigns.filter(c => c.id !== targetId), campaignRecord];
      }

      const sorted = sortCampaigns(updatedList);
      setCampaigns(sorted);
      setSpaCampaigns(sorted);
      if (sorted.length > 0) {
        setSpaCampaign(sorted[0]);
      }
      setEditingCampaignId(targetId);

      // Local optimistic cache
      try {
        localStorage.setItem('spa_campaigns', JSON.stringify(sorted));
        if (sorted.length > 0) {
          localStorage.setItem('spa_campaign', JSON.stringify(sorted[0]));
        }
        window.dispatchEvent(new Event('spa_campaigns_updated'));
      } catch (err) {
        console.error('Local cache error:', err);
      }

      // Supabase persist
      if (editingCampaignId) {
        await supabase
          .from('campaigns')
          .update(campaignRecord)
          .eq('id', editingCampaignId);
      } else {
        await supabase
          .from('campaigns')
          .insert([campaignRecord]);
      }

      await triggerRevalidation();
      showToast('Campaign card saved & updated on storefront!');
    } catch (err) {
      console.error('Error saving campaign:', err);
      showToast('Error saving campaign card. Please check your network.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered treatments for the picker
  const filteredTreatments = useMemo(() => {
    if (!treatmentSearch.trim()) return treatments;
    const q = treatmentSearch.toLowerCase();
    return treatments.filter(t => 
      t.title.toLowerCase().includes(q) || 
      (t.category && t.category.toLowerCase().includes(q))
    );
  }, [treatments, treatmentSearch]);

  const publishedCount = campaigns.filter(c => c.is_published !== false).length;
  const draftCount = campaigns.filter(c => c.is_published === false).length;

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
          <div className="flex items-center gap-2">
            <h1 className="fitlo-page-title">Campaign Cards</h1>
            <span className="fitlo-pill fitlo-pill--info">Website System</span>
          </div>
          <p className="fitlo-page-sub">
            Configure promotional ticket cards, seasonal discounts, date ranges, and eligible spa rituals for the Therapick customer homepage.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchCampaigns}
            className="fitlo-btn fitlo-btn--ghost"
            title="Refresh from database"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleNewCampaign}
            className="fitlo-btn fitlo-btn--primary"
          >
            <Plus size={15} strokeWidth={2.4} />
            <span>+ New Campaign</span>
          </button>
        </div>
      </div>

      {/* ─── FITLO 4-TILE SUMMARY METRICS STRIP ─── */}
      <div className="fitlo-kpis">
        <div className="fitlo-kpi fitlo-kpi--1">
          <div className="fitlo-kpi__label">Total Campaigns</div>
          <div className="fitlo-kpi__value">{campaigns.length}</div>
          <div className="fitlo-kpi__foot">
            <span>Configured promotion cards</span>
          </div>
        </div>

        <div className="fitlo-kpi fitlo-kpi--2">
          <div className="fitlo-kpi__label">Active on Storefront</div>
          <div className="fitlo-kpi__value">{publishedCount}</div>
          <div className="fitlo-kpi__foot">
            <span className="fitlo-delta fitlo-delta--up">● Live visible cards</span>
          </div>
        </div>

        <div className="fitlo-kpi fitlo-kpi--3">
          <div className="fitlo-kpi__label">Drafts / Hidden</div>
          <div className="fitlo-kpi__value">{draftCount}</div>
          <div className="fitlo-kpi__foot">
            <span>Inactive or staged</span>
          </div>
        </div>

        <div className="fitlo-kpi fitlo-kpi--4">
          <div className="fitlo-kpi__label">Available Rituals</div>
          <div className="fitlo-kpi__value">{treatments.length}</div>
          <div className="fitlo-kpi__foot">
            <span>Eligible for promo packages</span>
          </div>
        </div>
      </div>

      {/* ─── 2-COLUMN MAIN WORKSPACE ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Campaign Stack & Presets (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Campaign List Card */}
          <div className="fitlo-card overflow-hidden">
            <div className="fitlo-chead flex items-center justify-between pb-3 border-b border-[var(--fitlo-line)]">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--fitlo-ink)]">
                  Campaign Stack
                </h2>
                <p className="text-[11px] text-[var(--fitlo-muted)]">
                  Click to edit details or reorder priority
                </p>
              </div>
              <span className="fitlo-badge">{campaigns.length}</span>
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs text-[var(--fitlo-muted)] flex items-center justify-center gap-2">
                <RefreshCw size={14} className="animate-spin text-[var(--fitlo-accent)]" />
                <span>Loading campaigns...</span>
              </div>
            ) : campaigns.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--fitlo-muted)]">
                No campaigns found. Click &quot;+ New Campaign&quot; to create one.
              </div>
            ) : (
              <div className="divide-y divide-[var(--fitlo-line)] max-h-[500px] overflow-y-auto">
                {campaigns.map((camp, idx) => {
                  const isCurrent = editingCampaignId === camp.id;
                  const isPub = camp.is_published !== false;

                  return (
                    <div
                      key={camp.id || idx}
                      onClick={() => loadCampaignToForm(camp)}
                      className={`p-3.5 transition-all cursor-pointer group select-none ${
                        isCurrent
                          ? 'bg-[var(--fitlo-card-2)] border-l-4 border-l-[var(--fitlo-accent)]'
                          : 'hover:bg-[var(--fitlo-card-2)]/60 border-l-4 border-l-transparent'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Ticket Badge Icon */}
                        <div className="w-10 h-10 rounded-xl bg-[#3b82f6]/10 text-[#3b82f6] border border-[#3b82f6]/20 flex items-center justify-center shrink-0">
                          <Ticket size={18} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#3b82f6] truncate">
                              {camp.label || `${camp.discountPercentage}% OFF`}
                            </span>
                            <span className={`fitlo-pill ${isPub ? 'fitlo-pill--good' : 'fitlo-pill--warn'} text-[9px] py-0 px-1.5`}>
                              {isPub ? 'Live' : 'Draft'}
                            </span>
                          </div>

                          <h4 className="text-xs font-bold text-[var(--fitlo-ink)] truncate">
                            {camp.title || 'Untitled Campaign'}
                          </h4>

                          <div className="flex items-center gap-2 mt-1 text-[11px] text-[var(--fitlo-muted)]">
                            <span>#{camp.order ?? (idx + 1)}</span>
                            <span>•</span>
                            <span>{camp.discountPercentage || 0}% discount</span>
                            {camp.startDate && (
                              <>
                                <span>•</span>
                                <span>{camp.startDate}</span>
                              </>
                            )}
                          </div>

                          {/* Quick Action Buttons */}
                          <div className="mt-2.5 pt-2 border-t border-[var(--fitlo-line)] flex items-center justify-between opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={(e) => { e.stopPropagation(); handleMoveCampaign(idx, 'up'); }}
                                className="p-1 rounded text-[var(--fitlo-muted)] hover:text-[var(--fitlo-ink)] hover:bg-[var(--fitlo-card-3)] disabled:opacity-20"
                                title="Move up in display order"
                              >
                                <ArrowUp size={12} />
                              </button>
                              <button
                                type="button"
                                disabled={idx === campaigns.length - 1}
                                onClick={(e) => { e.stopPropagation(); handleMoveCampaign(idx, 'down'); }}
                                className="p-1 rounded text-[var(--fitlo-muted)] hover:text-[var(--fitlo-ink)] hover:bg-[var(--fitlo-card-3)] disabled:opacity-20"
                                title="Move down in display order"
                              >
                                <ArrowDown size={12} />
                              </button>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleTogglePublish(camp); }}
                                className="text-[11px] font-semibold text-[var(--fitlo-muted)] hover:text-[var(--fitlo-ink)]"
                              >
                                {isPub ? 'Hide' : 'Publish'}
                              </button>
                              {camp.id && (
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); handleDeleteCampaign(camp.id!); }}
                                  className="text-[var(--fitlo-muted)] hover:text-red-600 p-1 transition-colors"
                                  title="Delete campaign"
                                >
                                  <Trash2 size={12} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Quick Presets Bar */}
            <div className="p-3 bg-[var(--fitlo-card-2)] border-t border-[var(--fitlo-line)] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--fitlo-muted)] flex items-center gap-1">
                  <Sparkles size={11} className="text-[var(--fitlo-accent)]" />
                  <span>Quick Presets</span>
                </span>
                <span className="text-[10px] text-[var(--fitlo-muted)]">Click to load</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {CAMPAIGN_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[var(--fitlo-card)] border border-[var(--fitlo-line)] text-[var(--fitlo-ink)] hover:border-[var(--fitlo-ink)] transition-colors cursor-pointer"
                  >
                    {preset.title.split('&')[0].trim()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Realtime Live Preview & Comprehensive Editor Form (8 cols) */}
        <div className="lg:col-span-8 space-y-6">

          {/* 1. STOREFRONT REALTIME LIVE PREVIEW */}
          <div className="fitlo-card p-5 md:p-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--fitlo-ink)] flex items-center gap-1.5">
                  <Eye size={14} className="text-[var(--fitlo-accent)]" />
                  <span>Storefront Ticket Preview</span>
                </h3>
                <span className="text-[10px] text-[var(--fitlo-muted)]">(Updates in real-time)</span>
              </div>
              <span className="text-[11px] font-bold text-[#3b82f6]">
                Theme: Blue Campaign Ticket Card
              </span>
            </div>

            {/* Live Realistic Campaign Ticket Card */}
            <div className="relative w-full flex flex-row rounded-[24px] overflow-hidden shadow-xs border border-gray-200 bg-[#FAFAFA] min-h-[160px] md:min-h-[175px]">
              {/* Left Section (Blue) */}
              <div className="flex-1 bg-[#3b82f6] text-white p-5 flex flex-col justify-between relative z-10">
                <div>
                  <div className="inline-flex items-center text-[10px] md:text-xs font-bold tracking-wide uppercase mb-1.5 text-white/90">
                    {formData.label || `${formData.discountPercentage}% OFF`}
                  </div>
                  <h3 className="text-lg md:text-xl font-bold leading-tight mb-1.5 text-white">
                    {formData.title || 'Untitled Campaign'}
                  </h3>
                  <p className="text-white/80 text-xs line-clamp-2 leading-relaxed font-light">
                    {formData.description || 'Campaign promotional description will appear here on the homepage.'}
                  </p>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white">
                    <ArrowRight size={14} />
                  </div>
                  <span className="text-[11px] font-medium text-white/80">
                    {formData.selectedTreatments.length > 0 
                      ? `${formData.selectedTreatments.length} Rituals Included` 
                      : 'All Rituals Eligible'}
                  </span>
                </div>
              </div>

              {/* Divider with Cutouts */}
              <div className="relative w-0 flex flex-col justify-between items-center z-20">
                <div className="absolute top-0 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-[#f7f6f2] rounded-full border border-gray-200 shadow-inner"></div>
                <div className="absolute top-0 bottom-0 -translate-x-1/2 border-l-[3px] border-dotted border-gray-300/80 z-[-1]"></div>
                <div className="absolute bottom-0 -translate-x-1/2 translate-y-1/2 w-6 h-6 bg-[#f7f6f2] rounded-full border border-gray-200 shadow-inner"></div>
              </div>

              {/* Right Ticket Stub */}
              <div className="w-[100px] md:w-[125px] bg-white flex flex-col items-center justify-center py-4 px-2 shrink-0 text-center relative z-10">
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="flex flex-col items-center">
                    <div className="text-[8px] font-bold text-stone-400 uppercase tracking-widest mb-0.5">Start</div>
                    {formData.startDate ? (
                      <>
                        <div className="text-[10px] font-bold text-stone-700 uppercase leading-none">{formatMonth(formData.startDate)}</div>
                        <div className="text-lg font-black text-stone-900 leading-none my-0.5">{formatDay(formData.startDate)}</div>
                        <div className="text-[9px] font-bold text-stone-400 uppercase leading-none">{formatYear(formData.startDate)}</div>
                      </>
                    ) : (
                      <div className="text-xs font-bold text-stone-900 uppercase">NOW</div>
                    )}
                  </div>

                  <div className="w-6 h-px bg-stone-200"></div>

                  <div className="flex flex-col items-center">
                    <div className="text-[8px] font-bold text-stone-400 uppercase tracking-widest mb-0.5">End</div>
                    {formData.endDate ? (
                      <>
                        <div className="text-[10px] font-bold text-stone-700 uppercase leading-none">{formatMonth(formData.endDate)}</div>
                        <div className="text-lg font-black text-stone-900 leading-none my-0.5">{formatDay(formData.endDate)}</div>
                        <div className="text-[9px] font-bold text-stone-400 uppercase leading-none">{formatYear(formData.endDate)}</div>
                      </>
                    ) : (
                      <div className="text-[10px] font-bold text-stone-900 uppercase">{formData.duration ? formData.duration.replace('_', ' ') : 'OCT'}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. CAMPAIGN DETAILS FORM */}
          <div className="fitlo-card p-6">
            <div className="border-b border-[var(--fitlo-line)] pb-3 mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[var(--fitlo-ink)] tracking-tight">
                  {editingCampaignId ? 'Edit Campaign Card' : 'Create New Campaign Card'}
                </h3>
                <p className="text-xs text-[var(--fitlo-muted)] mt-0.5">
                  Position #{formData.order || 1} • Saved to Therapick storefront
                </p>
              </div>

              {/* Publish Toggle Button */}
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, is_published: !prev.is_published }))}
                className={`fitlo-pill ${formData.is_published ? 'fitlo-pill--good' : 'fitlo-pill--warn'} cursor-pointer`}
              >
                {formData.is_published ? '● Live on Storefront' : '○ Draft / Hidden'}
              </button>
            </div>

            <form onSubmit={handleSaveCampaign} className="space-y-5">
              
              {/* Row 1: Headline & Badge Label */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--fitlo-ink)] uppercase tracking-wider mb-1">
                    Headline / Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Summer Retreat & Spa Package"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="fitlo-input w-full"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--fitlo-ink)] uppercase tracking-wider mb-1">
                    Badge Label
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. LIMITED 10% OFF"
                    value={formData.label}
                    onChange={e => setFormData({ ...formData, label: e.target.value })}
                    className="fitlo-input w-full"
                  />
                </div>
              </div>

              {/* Row 2: Description */}
              <div>
                <label className="block text-xs font-bold text-[var(--fitlo-ink)] uppercase tracking-wider mb-1">
                  Card Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Describe the promo package, highlights, and in-villa experience..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="fitlo-input w-full resize-none"
                />
              </div>

              {/* Row 3: Discount %, Start Date, End Date, Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--fitlo-ink)] uppercase tracking-wider mb-1">
                    Discount Rate (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min="0"
                      max="100"
                      value={formData.discountPercentage}
                      onChange={e => setFormData({ ...formData, discountPercentage: Math.max(0, Math.min(100, Number(e.target.value))) })}
                      className="fitlo-input w-full pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--fitlo-muted)]">%</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--fitlo-ink)] uppercase tracking-wider mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                    className="fitlo-input w-full"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--fitlo-ink)] uppercase tracking-wider mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                    className="fitlo-input w-full"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--fitlo-ink)] uppercase tracking-wider mb-1">
                    Fallback Duration
                  </label>
                  <select
                    value={formData.duration}
                    onChange={e => setFormData({ ...formData, duration: e.target.value })}
                    className="fitlo-select w-full"
                  >
                    <option value="1_month">1 Month</option>
                    <option value="2_weeks">2 Weeks</option>
                    <option value="weekend">Weekend Special</option>
                    <option value="limited">Limited Time</option>
                  </select>
                </div>
              </div>

              {/* 3. ELIGIBLE SPA RITUALS & DURATIONS PICKER */}
              <div className="pt-3 border-t border-[var(--fitlo-line)] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="block text-xs font-bold text-[var(--fitlo-ink)] uppercase tracking-wider">
                      Eligible Spa Rituals & Durations
                    </label>
                    <p className="text-[11px] text-[var(--fitlo-muted)]">
                      Customers can book these rituals through the campaign card popup with the discount applied.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllTreatments}
                      className="text-xs font-bold text-[var(--fitlo-accent)] hover:underline cursor-pointer"
                    >
                      Select All
                    </button>
                    <span className="text-[var(--fitlo-line-2)]">•</span>
                    <button
                      type="button"
                      onClick={handleClearAllTreatments}
                      className="text-xs font-bold text-[var(--fitlo-muted)] hover:underline cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Treatment Search */}
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fitlo-muted)]" />
                  <input
                    type="text"
                    placeholder="Filter rituals by name or category..."
                    value={treatmentSearch}
                    onChange={e => setTreatmentSearch(e.target.value)}
                    className="fitlo-input w-full pl-8 text-xs py-1.5"
                  />
                </div>

                {/* Rituals list with duration toggles */}
                <div className="max-h-56 overflow-y-auto space-y-2 pr-1 border border-[var(--fitlo-line)] rounded-xl p-2.5 bg-[var(--fitlo-card-2)]/40">
                  {filteredTreatments.length === 0 ? (
                    <div className="p-4 text-center text-xs text-[var(--fitlo-muted)]">
                      No treatments match your search.
                    </div>
                  ) : (
                    filteredTreatments.map((t) => {
                      const selectedT = formData.selectedTreatments.find(st => st.treatmentId === t.id);
                      const isAnySelected = Boolean(selectedT && selectedT.durations.length > 0);

                      return (
                        <div
                          key={t.id}
                          className={`p-2.5 rounded-lg border transition-colors ${
                            isAnySelected
                              ? 'bg-[var(--fitlo-card)] border-[var(--fitlo-line-2)] shadow-2xs'
                              : 'bg-[var(--fitlo-card)]/50 border-[var(--fitlo-line)] opacity-70'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="min-w-0 pr-2">
                              <span className="text-xs font-bold text-[var(--fitlo-ink)] truncate block">
                                {t.title}
                              </span>
                              <span className="text-[10px] text-[var(--fitlo-muted)]">
                                {t.category || 'Spa Treatment'}
                              </span>
                            </div>

                            {isAnySelected && (
                              <span className="text-[10px] font-bold text-[var(--fitlo-accent)] flex items-center gap-1 shrink-0">
                                <Check size={11} strokeWidth={2.5} />
                                <span>{selectedT?.durations.length} Selected</span>
                              </span>
                            )}
                          </div>

                          {/* Duration Chips */}
                          <div className="flex flex-wrap gap-1.5">
                            {(t.options || []).map(opt => {
                              const isDurSelected = selectedT?.durations.includes(opt.duration);
                              return (
                                <button
                                  type="button"
                                  key={opt.duration}
                                  onClick={() => handleToggleTreatmentDuration(t.id, opt.duration)}
                                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                                    isDurSelected
                                      ? 'bg-[var(--fitlo-accent)] text-white shadow-2xs'
                                      : 'bg-[var(--fitlo-card-2)] text-[var(--fitlo-muted)] border border-[var(--fitlo-line)] hover:text-[var(--fitlo-ink)] hover:border-[var(--fitlo-line-2)]'
                                  }`}
                                >
                                  {isDurSelected && <Check size={10} strokeWidth={3} />}
                                  <span>{opt.duration} mins</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Form Bottom Actions */}
              <div className="pt-4 border-t border-[var(--fitlo-line)] flex items-center justify-between">
                <div className="text-xs text-[var(--fitlo-muted)]">
                  {editingCampaignId ? 'Editing existing campaign' : 'Creating new campaign'}
                </div>

                <div className="flex items-center gap-2">
                  {editingCampaignId && (
                    <button
                      type="button"
                      onClick={handleNewCampaign}
                      className="fitlo-btn fitlo-btn--ghost text-xs"
                    >
                      Cancel / New
                    </button>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="fitlo-btn fitlo-btn--primary text-xs"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw size={13} className="animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <CheckCheck size={14} />
                        <span>{editingCampaignId ? 'Save Campaign Changes' : 'Publish New Campaign'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

