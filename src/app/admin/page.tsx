'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Megaphone, PlusCircle, Store, Settings, LayoutDashboard, 
    UploadCloud, CheckCircle, Plus, Trash2, Edit3, Pin, 
    ChevronDown, ChevronUp, Calculator, LogOut,
    ArrowRight, ArrowUp, ArrowDown, Compass, ShieldCheck, Check, Ticket, Search, Menu, MoreHorizontal, Calendar, FileText, Heart, Clock, Share2, Layers
} from 'lucide-react';
import Link from 'next/link';
import { useSpa, SelectedCampaignTreatment, Treatment, Product, TherapistFee, Campaign, sortCampaigns, DEFAULT_CAMPAIGNS } from '@/context/SpaContext';
import { supabase } from '@/lib/supabase';
import BookingManagement from '@/components/BookingManagement';
import TherapickBookingManagement from '@/components/TherapickBookingManagement';
import AffiliateManagement from '@/components/admin/AffiliateManagement';
import TherapickAddonSettings from '@/components/admin/TherapickAddonSettings';
import { cx, btn, inputCls, selectCls, thCls, tdCls, StatusBadge, CountPill, EmptyState, SearchInput } from '@/components/admin/affiliate/ui';

// Quick Preset Campaigns for Trip & Spa Deals
const CAMPAIGN_PRESETS = [
    {
        title: "Summer Retreat & Spa Package",
        label: "Limited 10% OFF",
        description: "Relax deeply with customized flower baths, traditional Balinese massage, and organic botanical body wraps in the comfort of your villa.",
        discountPercentage: 10,
        image: "https://images.pexels.com/photos/3865712/pexels-photo-3865712.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop&crop=center",
        duration: "1_month"
    }
];

export default function AdminDashboard() {
    const triggerRevalidation = async () => {
        try {
            await fetch('/api/revalidate', { method: 'POST', body: JSON.stringify({ action: 'revalidate' }) });
        } catch(e) {
            console.error('Revalidation failed:', e);
        }
    };

    const { 
        treatments, setTreatments, 
        campaign, setCampaign,
        campaigns, setCampaigns,
        products, setProducts,
        siteBrandFilter, setSiteBrandFilter,
        therapists, setTherapists
    } = useSpa();

    const [activeTab, setActiveTab] = useState<'campaign' | 'treatment' | 'store' | 'fees' | 'calculator' | 'list' | 'settings' | 'promo' | 'bookings' | 'invoice' | 'affiliates' | 'addons'>('campaign');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    
    // File input ref for pinning treatments
    const pinImageInputRef = useRef<HTMLInputElement>(null);
    const [pendingPinId, setPendingPinId] = useState<string | null>(null);
    const [therapistFees, setTherapistFees] = useState<TherapistFee[]>([]);
    const [feeLoading, setFeeLoading] = useState(false);

    useEffect(() => {
        async function fetchFees() {
            const queryBrand = siteBrandFilter === 'central' ? 'elexoir' : siteBrandFilter;
            let { data } = await supabase.from('therapist_fees').select('*').eq('brand', queryBrand).order('created_at', { ascending: false });
            
            if (queryBrand !== 'elexoir' && (!data || data.length === 0)) {
                const fallback = await supabase.from('therapist_fees').select('*').eq('brand', 'elexoir').order('created_at', { ascending: false });
                data = fallback.data;
            }

            if (data) {
                setTherapistFees(data);
            }
        }
        fetchFees();
    }, [siteBrandFilter]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const brandParam = params.get('brand');
            const tabParam = params.get('tab');
            if (brandParam) {
                setSiteBrandFilter(brandParam);
            }
            if (tabParam) {
                setActiveTab(tabParam as any);
            }
        }
    }, [setSiteBrandFilter]);


    // Promo Codes State
    const [promoCodes, setPromoCodes] = useState<any[]>([]);
    const [isPromoFormLoading, setIsPromoFormLoading] = useState(false);
    const [promoForm, setPromoForm] = useState({ code: '', discount_type: 'percentage', discount_value: 0, max_uses: 0 });
    
    useEffect(() => {
        async function fetchPromos() {
            const queryBrand = siteBrandFilter === 'central' ? 'elexoir' : siteBrandFilter;
            const { data } = await supabase.from('promo_codes').select('*').eq('brand', queryBrand).order('created_at', { ascending: false });
            if (data) setPromoCodes(data);
        }
        if (activeTab === 'promo') fetchPromos();
    }, [activeTab, siteBrandFilter]);

    // Fetch data whenever siteBrandFilter changes in the admin panel
    useEffect(() => {
        let isMounted = true;
        async function fetchBrandData() {
            try {
                const queryBrand = siteBrandFilter === 'central' ? 'elexoir' : siteBrandFilter;
                let [treatmentsRes, productsRes, campaignsRes, therapistsRes] = await Promise.all([
                    supabase.from('treatments').select('*').eq('is_published', true).eq('brand', queryBrand).order('created_at', { ascending: false }),
                    supabase.from('products').select('*').eq('is_published', true).eq('brand', queryBrand).order('created_at', { ascending: false }),
                    supabase.from('campaigns').select('*').eq('is_published', true).eq('brand', queryBrand).order('created_at', { ascending: false }),
                    supabase.from('therapists').select('*').eq('is_active', true).eq('brand', queryBrand).order('created_at', { ascending: false })
                ]);
                
                if (queryBrand !== 'elexoir' && (!treatmentsRes.data || treatmentsRes.data.length === 0)) {
                    const fallbackRes = await Promise.all([
                        supabase.from('treatments').select('*').eq('is_published', true).eq('brand', 'elexoir').order('created_at', { ascending: false }),
                        supabase.from('products').select('*').eq('is_published', true).eq('brand', 'elexoir').order('created_at', { ascending: false }),
                        supabase.from('therapists').select('*').eq('is_active', true).eq('brand', 'elexoir').order('created_at', { ascending: false })
                    ]);
                    treatmentsRes = fallbackRes[0];
                    productsRes = fallbackRes[1];
                    therapistsRes = fallbackRes[2];
                }

                if (isMounted) {
                    if (treatmentsRes.data) setTreatments(treatmentsRes.data);
                    if (productsRes.data) setProducts(productsRes.data);
                    if (therapistsRes.data) setTherapists(therapistsRes.data);
                    if (campaignsRes.data && campaignsRes.data.length > 0) {
                        const sorted = sortCampaigns(campaignsRes.data);
                        setCampaigns(sorted);
                        setCampaign(sorted[0]);
                    } else if (queryBrand !== 'elexoir') {
                        // Fallback campaigns if empty
                        const { data: fallbackCamp } = await supabase.from('campaigns').select('*').eq('is_published', true).eq('brand', 'elexoir').order('created_at', { ascending: false });
                        if (fallbackCamp && fallbackCamp.length > 0) {
                            const sorted = sortCampaigns(fallbackCamp);
                            setCampaigns(sorted);
                            setCampaign(sorted[0]);
                        }
                    }
                }
            } catch (e) {
                console.error(e);
            }
        }
        
        fetchBrandData();
        return () => { isMounted = false; };
    }, [siteBrandFilter, setTreatments, setProducts, setCampaigns, setCampaign, setTherapists]);

    // Force tab switch if central is selected, or if brand is not therapick while on affiliates
    useEffect(() => {
        if (siteBrandFilter === 'central' && (activeTab === 'campaign' || activeTab === 'promo')) {
            setActiveTab('treatment');
        }
        if (siteBrandFilter !== 'therapick' && (activeTab as string) === 'affiliates') {
            setSiteBrandFilter('therapick');
        }
        if (activeTab === 'bookings' && siteBrandFilter !== 'central' && siteBrandFilter !== 'therapick') {
            setActiveTab('treatment');
        }
    }, [siteBrandFilter, activeTab]);

    const activeBrand = siteBrandFilter === 'central' ? 'elexoir' : siteBrandFilter;

    // Filter by Brand / Property (elexoir, thevisala, etc)
    const [selectedBrand, setSelectedBrand] = useState(activeBrand);

    // Campaign specific fields
    const [campaignTitle, setCampaignTitle] = useState(campaign?.title || 'Summer Retreat & Spa Package');
    const [campaignLabel, setCampaignLabel] = useState(campaign?.label || 'LIMITED 10% OFF');
    const [campaignDesc, setCampaignDesc] = useState(campaign?.description || 'Relax deeply with customized flower baths, traditional Balinese massage, and organic botanical body wraps in the comfort of your villa.');
    const [campaignDuration, setCampaignDuration] = useState(campaign?.duration || '1_month');
    const [discountPercentage, setDiscountPercentage] = useState<number>(campaign?.discountPercentage ?? 0);
    const [campaignStartDate, setCampaignStartDate] = useState(campaign?.startDate || '');
    const [campaignEndDate, setCampaignEndDate] = useState(campaign?.endDate || '');
    const [campaignOrder, setCampaignOrder] = useState<number>(campaign?.order || 1);
    const [campaignTreatments, setCampaignTreatments] = useState<SelectedCampaignTreatment[]>(campaign?.selectedTreatments || []);
    const [campaignImage, setCampaignImage] = useState<string>(campaign?.image_url || campaign?.image || '');
    const [campaignImageFile, setCampaignImageFile] = useState<File | null>(null);
    const [editingCampaignId, setEditingCampaignId] = useState<string | null>(campaign?.id || null);

    // Treatment selection helpers for campaigns (must be declared before handlers)
    const selectAllTreatments = () => {
        const all: SelectedCampaignTreatment[] = treatments.map(t => ({
            treatmentId: t.id,
            durations: t.options.map(o => o.duration)
        }));
        setCampaignTreatments(all);
    };

    const clearAllCampaignTreatments = () => {
        setCampaignTreatments([]);
    };

    const toggleCampaignTreatmentDuration = (treatmentId: string, duration: string) => {
        setCampaignTreatments(prev => {
            const existing = prev.find(t => t.treatmentId === treatmentId);
            if (existing) {
                if (existing.durations.includes(duration)) {
                    const newDurations = existing.durations.filter(d => d !== duration);
                    if (newDurations.length === 0) {
                        return prev.filter(t => t.treatmentId !== treatmentId);
                    }
                    return prev.map(t => t.treatmentId === treatmentId ? { ...t, durations: newDurations } : t);
                }
                return prev.map(t => t.treatmentId === treatmentId ? { ...t, durations: [...t.durations, duration] } : t);
            }
            return [...prev, { treatmentId, durations: [duration] }];
        });
    };

    const scrollToCampaignForm = () => {
        setTimeout(() => {
            document.getElementById('campaign-form')?.scrollIntoView({ behavior: 'smooth' });
        }, 50);
    };

    // Sync when campaign changes
    const loadCampaignToForm = (c: Campaign) => {
        setCampaignTitle(c.title || '');
        setCampaignLabel(c.label || '');
        setCampaignDesc(c.description || '');
        setCampaignDuration(c.duration || '1_month');
        setDiscountPercentage(c.discountPercentage ?? 0);
        setCampaignStartDate(c.startDate || '');
        setCampaignEndDate(c.endDate || '');
        setCampaignTreatments(c.selectedTreatments && c.selectedTreatments.length > 0 ? c.selectedTreatments : treatments.map(t => ({ treatmentId: t.id, durations: t.options.map(o => o.duration) })));
        setCampaignImage(c.image_url || c.image || '');
        setCampaignImageFile(null);
        setCampaignOrder(c.order ?? (campaigns.findIndex(item => item.id === c.id) + 1));
        setEditingCampaignId(c.id || null);
        scrollToCampaignForm();
    };

    const handleNewCampaign = () => {
        setCampaignTitle('');
        setCampaignLabel('EXCLUSIVE OFFER');
        setCampaignDesc('Relax deeply with customized treatments in the comfort of your villa.');
        setCampaignDuration('1_month');
        setDiscountPercentage(0);
        setCampaignStartDate('');
        setCampaignEndDate('');
        selectAllTreatments();
        setCampaignImage('');
        setCampaignImageFile(null);
        setCampaignOrder(campaigns.length + 1);
        setEditingCampaignId(null);
        scrollToCampaignForm();
    };

    const handleRestoreDefaultCampaigns = () => {
        if (!confirm('Load the 2 standard campaigns (Summer Retreat + Bali Day Trip)? Existing cards will be updated.')) return;
        setCampaigns(DEFAULT_CAMPAIGNS);
        setCampaign(DEFAULT_CAMPAIGNS[0]);
        loadCampaignToForm(DEFAULT_CAMPAIGNS[0]);
        try {
            localStorage.setItem('spa_campaigns', JSON.stringify(DEFAULT_CAMPAIGNS));
            localStorage.setItem('spa_campaign', JSON.stringify(DEFAULT_CAMPAIGNS[0]));
            if (typeof window !== 'undefined') window.dispatchEvent(new Event('spa_campaigns_updated'));
        } catch(e) {}
    };

    const handleMoveCampaign = async (index: number, direction: 'up' | 'down') => {
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= campaigns.length) return;
        
        const reordered = [...campaigns];
        const [moved] = reordered.splice(index, 1);
        reordered.splice(targetIndex, 0, moved);
        
        // Assign explicit order numbers 1, 2, 3...
        const updated = reordered.map((c, i) => ({ ...c, order: i + 1 }));
        setCampaigns(updated);
        if (updated.length > 0) {
            setCampaign(updated[0]);
        }
        
        try {
            localStorage.setItem('spa_campaigns', JSON.stringify(updated));
            if (updated.length > 0) localStorage.setItem('spa_campaign', JSON.stringify(updated[0]));
            if (typeof window !== 'undefined') window.dispatchEvent(new Event('spa_campaigns_updated'));
        } catch(e) {}

        try {
            for (const item of updated) {
                if (item.id) {
                    await supabase.from('campaigns').update({ order: item.order }).eq('id', item.id);
                }
            }
        } catch(e) {
            console.warn("Supabase reorder failed", e);
        }
    };

    const handleDeleteCampaign = async (id: string) => {
        if (!confirm('Are you sure you want to delete this campaign?')) return;
        try {
            const updated = campaigns.filter(c => c.id !== id);
            setCampaigns(updated);
            if (updated.length > 0) {
                setCampaign(updated[0]);
                if (editingCampaignId === id) setEditingCampaignId(null);
            } else {
                setCampaign(null);
                handleNewCampaign();
            }
            try {
                localStorage.setItem('spa_campaigns', JSON.stringify(updated));
                if (updated.length > 0) localStorage.setItem('spa_campaign', JSON.stringify(updated[0]));
                else localStorage.removeItem('spa_campaign');
                if (typeof window !== 'undefined') window.dispatchEvent(new Event('spa_campaigns_updated'));
            } catch(e) {}

            try {
                await supabase.from('campaigns').delete().eq('id', id);
            } catch(e) {
                console.warn("Supabase delete failed (using local sync)", e);
            }
        } catch(e) {
            console.error('Failed to delete campaign', e);
        }
    };

    const handleTogglePublishCampaign = async (camp: Campaign) => {
        const newStatus = camp.is_published === false ? true : false;
        const updated = campaigns.map(c => c.id === camp.id ? { ...c, is_published: newStatus } : c);
        setCampaigns(updated);
        try {
            localStorage.setItem('spa_campaigns', JSON.stringify(updated));
            if (typeof window !== 'undefined') window.dispatchEvent(new Event('spa_campaigns_updated'));
        } catch(e) {}

        try {
            if (camp.id) {
                await supabase.from('campaigns').update({ is_published: newStatus }).eq('id', camp.id);
            }
        } catch(e) {
            console.warn("Supabase update publish failed (using local sync)", e);
        }
    };

    const applyCampaignPreset = (preset: typeof CAMPAIGN_PRESETS[0]) => {
        setCampaignTitle(preset.title);
        setCampaignLabel(preset.label);
        setCampaignDesc(preset.description);
        setDiscountPercentage(preset.discountPercentage);
        setCampaignStartDate('');
        setCampaignEndDate('');
        setCampaignImage(preset.image);
        setCampaignImageFile(null);
        setCampaignDuration(preset.duration);
        setCampaignOrder(campaigns.length + 1);
        setEditingCampaignId(null); // CRITICAL: creating a new card from preset
        selectAllTreatments();
    };

    // Treatment Fields
    const [treatmentTitle, setTreatmentTitle] = useState('');
    const [treatmentCategory, setTreatmentCategory] = useState('massage');
    const [treatmentDesc, setTreatmentDesc] = useState('');
    const [editingTreatmentId, setEditingTreatmentId] = useState<string | null>(null);
    const [pricingOptions, setPricingOptions] = useState([{ duration: '', price: '' }]);
    const [benefits, setBenefits] = useState(['']);

    // Store Fields
    const [productTitle, setProductTitle] = useState('');
    const [productCategory, setProductCategory] = useState('');
    const [productPrice, setProductPrice] = useState('');
    const [productImage, setProductImage] = useState('');
    const [productStock, setProductStock] = useState(10);
    const [productDesc, setProductDesc] = useState('');
    const [productHowToUse, setProductHowToUse] = useState('');
    const [productIngredients, setProductIngredients] = useState('');
    const [editingProductId, setEditingProductId] = useState<string | null>(null);

    // Dynamic fields for Therapist Fees
    const [feeInputs, setFeeInputs] = useState<{ [key: string]: string }>({});
    const [feeSearch, setFeeSearch] = useState('');
    const [menuSearch, setMenuSearch] = useState('');
    const [editingFee, setEditingFee] = useState<{id: string, duration: string} | null>(null);
    const [expandedFees, setExpandedFees] = useState<{ [key: string]: boolean }>({});
    
    useEffect(() => {
        const initial: { [key: string]: string } = {};
        therapistFees.forEach(f => {
            initial[`${f.treatment_id}-${f.duration}`] = f.fee;
        });
        setFeeInputs(initial);
    }, [therapistFees]);

    // Calculator calculations state
    const [calculations, setCalculations] = useState<{
        id: string;
        treatmentId: string;
        duration: string;
        treatmentsCount: number;
        therapistsCount: number;
        showAdvanced: boolean;
    }[]>([]);

    const [listView, setListView] = useState<'campaign' | 'treatments' | 'store' | 'fees'>('campaign');

    const handleAddPricing = () => setPricingOptions([...pricingOptions, { duration: '', price: '' }]);
    const handleRemovePricing = (index: number) => {
        if (pricingOptions.length > 1) {
            setPricingOptions(pricingOptions.filter((_, i) => i !== index));
        }
    };
    const handlePricingChange = (index: number, field: 'duration' | 'price', value: string) => {
        const newOptions = [...pricingOptions];
        newOptions[index][field] = value;
        setPricingOptions(newOptions);
    };

    const handleAddBenefit = () => setBenefits([...benefits, '']);
    const handleRemoveBenefit = (index: number) => {
        if (benefits.length > 1) {
            setBenefits(benefits.filter((_, i) => i !== index));
        }
    };
    const handleBenefitChange = (index: number, value: string) => {
        const newBenefits = [...benefits];
        newBenefits[index] = value;
        setBenefits(newBenefits);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setter(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCampaignImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                alert("Please select a valid image file.");
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                alert("File too large. Maximum size is 5MB.");
                return;
            }
            setCampaignImageFile(file);
            setCampaignImage(URL.createObjectURL(file));
        }
    };

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

    const handlePromoSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!promoForm.code) return;
        setIsPromoFormLoading(true);
        try {
            const inserts = ['elexoir', 'bali', 'therapick'].map(b => ({
                code: promoForm.code.trim().toUpperCase(),
                discount_type: promoForm.discount_type,
                discount_value: promoForm.discount_value,
                max_uses: promoForm.max_uses || 0,
                brand: b,
                is_active: true
            }));
            const { error } = await supabase.from('promo_codes').insert(inserts);
            if (error) throw error;
            setSuccess(true);
                triggerRevalidation();
            setTimeout(() => setSuccess(false), 3000);
            setPromoForm({ code: '', discount_type: 'percentage', discount_value: 0, max_uses: 0 });
            // re-fetch
            const { data } = await supabase.from('promo_codes').select('*').eq('brand', activeBrand).order('created_at', { ascending: false });
            if (data) setPromoCodes(data);
        } catch (err) {
            console.error(err);
            alert('Failed to save promo code. It might already exist.');
        } finally {
            setIsPromoFormLoading(false);
        }
    };

    const togglePromo = async (id: string, currentStatus: boolean) => {
        await supabase.from('promo_codes').update({ is_active: !currentStatus }).eq('id', id);
        setPromoCodes(prev => prev.map(p => p.id === id ? { ...p, is_active: !currentStatus } : p));
    };

    const deletePromo = async (id: string) => {
        if (!confirm('Delete this promo code?')) return;
        await supabase.from('promo_codes').delete().eq('id', id);
        setPromoCodes(prev => prev.filter(p => p.id !== id));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        try {
            if (activeTab === 'campaign') {
                const targetId = editingCampaignId || generateUUID();
                const targetOrder = Number(campaignOrder) || (editingCampaignId ? 1 : campaigns.length + 1);
                
                let finalImageUrl = campaignImage;

                if (campaignImageFile) {
                    const ext = campaignImageFile.name.split('.').pop() || 'png';
                    const path = `campaigns/${targetId}/image-${Date.now()}.${ext}`;
                    
                    console.log(`Uploading campaign image to ${path}`, {
                        mimeType: campaignImageFile.type,
                        sizeBytes: campaignImageFile.size
                    });
                    
                    const { error } = await supabase.storage
                        .from('campaign-images')
                        .upload(path, campaignImageFile, { 
                            upsert: true,
                            contentType: campaignImageFile.type || 'image/jpeg',
                            cacheControl: '3600'
                        });
                        
                    if (error) {
                        console.error("Storage upload failed:", error);
                        alert(`Failed to upload image: ${error.message}`);
                        setIsSubmitting(false);
                        return;
                    }
                    
                    const { data: publicUrlData } = supabase.storage
                        .from('campaign-images')
                        .getPublicUrl(path);
                        
                    finalImageUrl = publicUrlData.publicUrl;
                    setCampaignImage(finalImageUrl); // Update input field to remove blob URL
                    setCampaignImageFile(null); // Clear the file selection
                }

                // Prevent base64 from being saved in image_url fallback
                if (finalImageUrl.startsWith('data:')) {
                    finalImageUrl = '';
                }

                const baseCampaignData = {
                    title: campaignTitle.trim() || 'Special Spa Campaign',
                    label: campaignLabel.trim() || 'EXCLUSIVE OFFER',
                    description: campaignDesc.trim() || 'Book any eligible treatment below to claim your exclusive perk & special discount.',
                    image_url: finalImageUrl || null,
                    image: null, // Always write null to the base64 column
                    duration: campaignDuration || '1_month',
                    discountPercentage: Number(discountPercentage) || 0,
                    startDate: campaignStartDate || undefined,
                    endDate: campaignEndDate || undefined,
                    selectedTreatments: campaignTreatments.length > 0 
                        ? campaignTreatments 
                        : treatments.map(t => ({ treatmentId: t.id, durations: t.options.map(o => o.duration) })),
                    order: targetOrder,
                    is_published: true,
                };
                const campaignData: Campaign = {
                    ...baseCampaignData,
                    id: editingCampaignId || targetId,
                    brand: activeBrand
                } as any;

                let updatedList: Campaign[];
                if (editingCampaignId) {
                    updatedList = campaigns.map(c => c.id === editingCampaignId ? campaignData : c);
                } else {
                    updatedList = [...campaigns.filter(c => c.id !== targetId), campaignData];
                }

                const updated = sortCampaigns(updatedList);
                setCampaigns(updated);
                setCampaign(updated[0] || null);
                setEditingCampaignId(targetId);

                try {
                    localStorage.setItem('spa_campaigns', JSON.stringify(updated));
                    if (updated.length > 0) {
                        localStorage.setItem('spa_campaign', JSON.stringify(updated[0]));
                    }
                    if (typeof window !== 'undefined') {
                        window.dispatchEvent(new Event('spa_campaigns_updated'));
                    }
                } catch(e) {
                    console.error("Failed to save to localStorage:", e);
                }

                try {
                    if (editingCampaignId) {
                        await supabase.from('campaigns').update(campaignData).eq('id', editingCampaignId);
                    } else {
                        const brands = ['elexoir', 'bali', 'therapick'];
                        const inserts = brands.map(b => ({
                            ...baseCampaignData,
                            brand: b,
                            id: b === activeBrand ? targetId : generateUUID()
                        }));
                        const { data, error } = await supabase.from('campaigns').insert(inserts).select();
                        if (error) {
                            console.warn("Supabase campaign insert warning:", error);
                        } else if (data && data.length > 0) {
                            const saved = data.find((c: any) => c.brand === activeBrand) || data[0];
                            if (saved?.id) {
                                setEditingCampaignId(saved.id);
                            }
                        }
                    }
                } catch (err) {
                    console.warn("Supabase campaign sync warning:", err);
                }

                setSuccess(true);
                triggerRevalidation();
                setTimeout(() => setSuccess(false), 3500);
            } else if (activeTab === 'treatment') {
                const treatmentData = {
                    title: treatmentTitle,
                    category: treatmentCategory,
                    desc: treatmentDesc,
                    benefits: benefits.filter(b => b.trim() !== ''),
                    bgPattern: 'from-secondary/10 via-white to-white',
                    options: pricingOptions.map(o => ({ duration: o.duration, price: o.price })),
                    is_published: true,
                    brand: siteBrandFilter
                };
                
                if (editingTreatmentId) {
                    await supabase.from('treatments').update(treatmentData).eq('id', editingTreatmentId);
                    setTreatments(prev => prev.map(t => t.id === editingTreatmentId ? { ...t, ...treatmentData } : t));
                } else {
                    const inserts = ['elexoir', 'bali', 'therapick'].map(b => ({ ...treatmentData, brand: b }));
                    const { data } = await supabase.from('treatments').insert(inserts).select();
                    if (data && data.length > 0) {
                        const currentBrandTreatment = data.find((t: any) => t.brand === activeBrand) || data[0];
                        setTreatments(prev => [...prev, currentBrandTreatment as Treatment]);
                    }
                }
                setEditingTreatmentId(null);
                setTreatmentTitle('');
                setTreatmentDesc('');
                setBenefits(['']);
                setPricingOptions([{ duration: '', price: '' }]);
                setSuccess(true);
                triggerRevalidation();
                setTimeout(() => setSuccess(false), 3000);
            } else if (activeTab === 'store') {
                const productData = {
                    title: productTitle,
                    category: productCategory || 'Accessories',
                    price: productPrice,
                    image: productImage || 'https://images.pexels.com/photos/6724391/pexels-photo-6724391.jpeg',
                    description: productDesc,
                    stock: productStock,
                    howToUse: productHowToUse,
                    ingredients: productIngredients,
                    is_published: true,
                    brand: siteBrandFilter
                };
                
                if (editingProductId) {
                    await supabase.from('products').update(productData).eq('id', editingProductId);
                    setProducts(prev => prev.map(p => p.id === editingProductId ? { ...p, ...productData } : p));
                } else {
                    const inserts = ['elexoir', 'bali', 'therapick'].map(b => ({ ...productData, brand: b }));
                    const { data } = await supabase.from('products').insert(inserts).select();
                    if (data && data.length > 0) {
                        const currentBrandProduct = data.find((p: any) => p.brand === activeBrand) || data[0];
                        setProducts(prev => [...prev, currentBrandProduct as Product]);
                    }
                }
                setEditingProductId(null);
                setProductTitle('');
                setProductCategory('');
                setProductPrice('');
                setProductImage('');
                setProductStock(10);
                setProductDesc('');
                setProductHowToUse('');
                setProductIngredients('');
                setSuccess(true);
                triggerRevalidation();
                setTimeout(() => setSuccess(false), 3000);
            }
        } catch (error) {
            console.error('Error saving data:', error);
            alert('Operation complete.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSaveFee = async (treatmentId: string, duration: string) => {
        const fee = feeInputs[`${treatmentId}-${duration}`] || '';
        try {
            const existingFee = therapistFees.find(f => f.treatment_id === treatmentId && f.duration === duration);
            if (existingFee) {
                await supabase.from('therapist_fees').update({ fee }).eq('id', existingFee.id);
                setTherapistFees(prev => prev.map(f => f.id === existingFee.id ? { ...f, fee } : f));
            } else {
                const { data } = await supabase.from('therapist_fees').insert([{
                    treatment_id: treatmentId,
                    duration,
                    fee,
                    brand: activeBrand
                }]).select();
                if (data && data.length > 0) {
                    setTherapistFees(prev => [...prev, data[0] as TherapistFee]);
                }
            }
            alert('Therapist fee saved successfully!');
            setEditingFee(null);
            triggerRevalidation();
        } catch (e: any) {
            alert('Fee updated locally.');
            setEditingFee(null);
        }
    };

    const handleDeleteFee = async (treatmentId: string, duration: string) => {
        const pin = prompt('Enter admin PIN to remove fee:');
        if (pin !== (process.env.NEXT_PUBLIC_DELETE_PIN || '022320')) {
            alert('Incorrect PIN');
            return;
        }
        
        try {
            const existingFee = therapistFees.find(f => f.treatment_id === treatmentId && f.duration === duration);
            if (existingFee) {
                await supabase.from('therapist_fees').delete().eq('id', existingFee.id);
                setTherapistFees(prev => prev.filter(f => f.id !== existingFee.id));
                setFeeInputs(prev => {
                    const newInputs = { ...prev };
                    delete newInputs[`${treatmentId}-${duration}`];
                    return newInputs;
                });
                alert('Therapist fee removed successfully!');
                triggerRevalidation();
            }
        } catch (e: any) {
            alert('Error removing fee.');
        }
    };

    const handleTogglePin = async (treatment: Treatment) => {
        if (!treatment.is_pinned) {
            setPendingPinId(treatment.id);
            if (pinImageInputRef.current) {
                pinImageInputRef.current.click();
            }
        } else {
            try {
                await supabase.from('treatments').update({
                    is_pinned: false,
                    pinned_image: null
                }).eq('id', treatment.id);
                setTreatments(prev => prev.map(t => t.id === treatment.id ? { ...t, is_pinned: false, pinned_image: undefined } : t));
            } catch (err: any) {
                console.error(err);
            }
        }
    };

    const handlePinImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && pendingPinId) {
            if (!file.type.startsWith('image/')) {
                alert("Please select a valid image file.");
                setPendingPinId(null);
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                alert("File too large. Maximum size is 5MB.");
                setPendingPinId(null);
                return;
            }

            const ext = file.name.split('.').pop() || 'png';
            const path = `treatments/${pendingPinId}/pinned.${ext}`;
            
            console.log(`Uploading treatment pinned image to ${path}`, {
                mimeType: file.type,
                sizeBytes: file.size
            });

            try {
                const { error } = await supabase.storage
                    .from('campaign-images')
                    .upload(path, file, { 
                        upsert: true,
                        contentType: file.type || 'image/jpeg',
                        cacheControl: '3600'
                    });

                if (error) {
                    console.error("Storage upload failed:", error);
                    alert(`Failed to upload image: ${error.message}`);
                    setPendingPinId(null);
                    return;
                }

                const { data: publicUrlData } = supabase.storage
                    .from('campaign-images')
                    .getPublicUrl(path);

                const publicUrl = publicUrlData.publicUrl;

                await supabase.from('treatments').update({
                    is_pinned: true,
                    pinned_image: publicUrl
                }).eq('id', pendingPinId);
                
                setTreatments(prev => prev.map(t => t.id === pendingPinId ? { ...t, is_pinned: true, pinned_image: publicUrl } : t));
            } catch (err: any) {
                console.error("Update failed", err);
                alert("Failed to save pinned image URL to database.");
            }
            setPendingPinId(null);
        }
    };

    return (
        <div className="text-neutral-900 flex flex-col md:flex-row font-sans w-full min-w-0 gap-5">
            
            {/* Desktop Minimalist Monochrome Sidebar */}
            <aside className="hidden md:flex flex-col w-64 bg-white/95 border border-stone-200/90 rounded-2xl p-4 shadow-2xs z-10 shrink-0 self-start space-y-4">
                <div className="pb-3 border-b border-stone-100 flex flex-col gap-2.5">
                    <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block">Workspace</span>
                        <h2 className="text-sm font-bold tracking-tight text-neutral-900">Admin Controls</h2>
                    </div>
                    <div>
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-stone-500 block mb-1">Brand Scope</label>
                        <select 
                            id="brandSelect"
                            value={siteBrandFilter}
                            onChange={(e) => setSiteBrandFilter(e.target.value)}
                            className="w-full bg-white border border-stone-200 rounded-full px-3 py-1.5 text-xs font-semibold text-neutral-900 focus:outline-none focus:border-amber-400 cursor-pointer shadow-2xs"
                        >
                            <option value="therapick">Therapick</option>
                            <option value="central">Central Admin</option>
                            <option value="elexoir">Elexoir Home Spa</option>
                            <option value="bali">Home Spa Ubud</option>
                        </select>
                        <div className="grid grid-cols-2 gap-1 mt-1.5">
                            {[
                                { id: 'therapick', label: 'Therapick' },
                                { id: 'central', label: 'Central' },
                                { id: 'elexoir', label: 'Elexoir' },
                                { id: 'bali', label: 'Home Spa' }
                            ].map(b => (
                                <button
                                    key={b.id}
                                    type="button"
                                    id={`brand-chip-${b.id}`}
                                    onClick={() => setSiteBrandFilter(b.id)}
                                    className={`px-2 py-1 rounded-full text-[11px] font-semibold transition-all text-center cursor-pointer ${
                                        siteBrandFilter === b.id 
                                            ? 'bg-neutral-900 text-white shadow-2xs' 
                                            : 'bg-stone-100 text-stone-600 hover:text-neutral-900 hover:bg-stone-200/70'
                                    }`}
                                >
                                    {b.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <nav className="flex-1 space-y-1 overflow-y-auto">
                    {[
                        ...(siteBrandFilter === 'central' ? [{ id: 'bookings', icon: Calendar, label: 'Booking' }, { id: 'invoice', icon: Ticket, label: 'Invoices' }] : []),
                        ...(siteBrandFilter === 'therapick' ? [{ id: 'bookings', icon: Calendar, label: 'Bookings' }, { id: 'affiliates', icon: Share2, label: 'Affiliates' }, { id: 'addons', icon: Layers, label: 'Add-on Settings' }] : []),
                        { id: 'campaign', icon: Megaphone, label: 'Campaign Card' },
                        { id: 'promo', icon: Ticket, label: 'Promo Codes' },
                        { id: 'treatment', icon: PlusCircle, label: 'Treatments' },
                        { id: 'store', icon: Store, label: 'Store Products' },
                        { id: 'fees', icon: Settings, label: 'Therapist Fees' },
                        { id: 'calculator', icon: Calculator, label: 'Commission Calc' },
                        { id: 'list', icon: LayoutDashboard, label: 'Menu Overview' },
                    ].filter(tab => siteBrandFilter !== 'central' || !['campaign', 'promo'].includes(tab.id)).map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-full text-xs font-semibold tracking-tight transition-all cursor-pointer ${
                                    isActive 
                                    ? 'bg-neutral-900 text-white shadow-xs' 
                                    : 'text-stone-600 hover:bg-stone-100 hover:text-neutral-900'
                                }`}
                            >
                                <Icon size={14} strokeWidth={isActive ? 2.5 : 2} />
                                {tab.label}
                            </button>
                        );
                    })}
                </nav>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 relative min-w-0 pb-12">
                
                {/* Sticky Mobile Admin Selector */}
                <div className="md:hidden sticky top-0 z-40 pt-3 px-4 pb-2 bg-white/95 backdrop-blur-xl border-b border-[#E5E5E5] mb-2">
                    <div className="bg-white border border-[#E5E5E5] rounded-xl p-2 shadow-xs flex items-center justify-between">
                        <h2 className="text-[11px] font-medium uppercase tracking-wider text-[#737373] pl-2 truncate">Select Admin Dashboard</h2>
                        <div className="relative w-36 shrink-0">
                            <select 
                                value={siteBrandFilter}
                                onChange={(e) => setSiteBrandFilter(e.target.value)}
                                className="w-full bg-black text-white rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none appearance-none"
                            >
                                <option value="therapick">Therapick</option>
                                <option value="central">Central Admin</option>
                                <option value="elexoir">Elexoir</option>
                                <option value="bali">Home Spa Ubud</option>
                            </select>
                            <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
                                <ChevronDown size={12} className="text-white/60" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Sidebar (Drawer) */}
                <div id="mobile-sidebar" className="md:hidden fixed inset-0 z-[60] translate-x-full transition-transform duration-300 flex">
                    <div className="flex-1 bg-black/20 backdrop-blur-sm" onClick={() => document.getElementById('mobile-sidebar')?.classList.add('translate-x-full')}></div>
                    <div className="w-64 bg-white h-full shadow-2xl flex flex-col border-l border-[#E5E5E5]">
                        <div className="p-4 border-b border-[#E5E5E5] flex justify-between items-center bg-[#FAFAFA]">
                            <span className="text-xs font-semibold uppercase tracking-wider text-black">Menu Options</span>
                            <button onClick={() => document.getElementById('mobile-sidebar')?.classList.add('translate-x-full')} className="p-1.5 text-[#737373] hover:text-black">
                                <span className="font-bold text-xl leading-none">&times;</span>
                            </button>
                        </div>
                        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
                            {[
                                ...(siteBrandFilter === 'central' ? [{ id: 'invoice', icon: Ticket, label: 'Invoices' }] : [
                                    { id: 'campaign', icon: Megaphone, label: 'Campaign Card' },
                                    { id: 'promo', icon: Ticket, label: 'Promo Codes' },
                                ]),
                                ...(siteBrandFilter === 'therapick' ? [{ id: 'bookings', icon: Calendar, label: 'Bookings' }, { id: 'affiliates', icon: Share2, label: 'Affiliates' }, { id: 'addons', icon: Layers, label: 'Add-on Settings' }] : []),
                                { id: 'store', icon: Store, label: 'Store Products' },
                                { id: 'calculator', icon: Calculator, label: 'Commission Calc' },
                            ].map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => {
                                            setActiveTab(tab.id as any);
                                            document.getElementById('mobile-sidebar')?.classList.add('translate-x-full');
                                        }}
                                        className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                                            isActive ? 'bg-black text-white' : 'text-[#525252] hover:bg-[#F5F5F5] hover:text-black'
                                        }`}
                                    >
                                        <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>
                </div>

                <div className={`mx-auto p-4 md:p-8 ${
                    activeTab === 'affiliates' ? 'w-full max-w-none'
                    : (activeTab === 'bookings' || activeTab === 'campaign') ? 'max-w-7xl' 
                    : (activeTab === 'list' || activeTab === 'fees' ? 'max-w-6xl' : 'max-w-4xl')
                }`}>

                    {/* CAMPAIGN CARD SETUP TAB */}
                    {activeTab === 'campaign' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            {/* Header */}
                            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-black">Campaigns</h1>
                                    <p className="text-[13px] text-[#737373] mt-0.5">Manage promotional campaigns, seasonal discount cards, and eligible spa rituals</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={handleNewCampaign}
                                        className={cx(btn.base, btn.primary, btn.sm)}
                                    >
                                        <Plus size={14} /> New Campaign
                                    </button>
                                </div>
                            </header>

                            {/* Summary metrics */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 border border-[#E5E5E5] rounded-xl divide-[#E5E5E5] [&>*]:border-[#E5E5E5] overflow-hidden">
                                <div className="p-4 bg-white">
                                    <div className="text-xs text-[#737373]">Total campaigns</div>
                                    <div className="text-lg md:text-xl font-semibold text-black mt-1 tabular-nums">{campaigns.length}</div>
                                    <div className="text-[11px] text-[#A3A3A3] mt-0.5">Active or draft</div>
                                </div>
                                <div className="p-4 bg-white border-l">
                                    <div className="text-xs text-[#737373]">Published</div>
                                    <div className="text-lg md:text-xl font-semibold text-black mt-1 tabular-nums">
                                        {campaigns.filter((c) => c.is_published !== false).length}
                                    </div>
                                    <div className="text-[11px] text-[#A3A3A3] mt-0.5">Live on storefront</div>
                                </div>
                                <div className="p-4 bg-white border-t lg:border-t-0 lg:border-l">
                                    <div className="text-xs text-[#737373]">Drafts / Hidden</div>
                                    <div className="text-lg md:text-xl font-semibold text-black mt-1 tabular-nums">
                                        {campaigns.filter((c) => c.is_published === false).length}
                                    </div>
                                    <div className="text-[11px] text-[#A3A3A3] mt-0.5">Not visible</div>
                                </div>
                                <div className="p-4 bg-white border-t lg:border-t-0 border-l">
                                    <div className="text-xs text-[#737373]">Eligible treatments</div>
                                    <div className="text-lg md:text-xl font-semibold text-black mt-1 tabular-nums">{treatments.length}</div>
                                    <div className="text-[11px] text-[#A3A3A3] mt-0.5">Available for packages</div>
                                </div>
                            </div>

                            <div className="w-full flex flex-col lg:flex-row gap-6">
                                {/* Left Sidebar: Campaigns List */}
                                <div className="w-full lg:w-1/3 flex flex-col gap-4">
                                    <div className="bg-white border border-[#E5E5E5] rounded-xl overflow-hidden shadow-xs flex-1 flex flex-col">
                                        <div className="px-4 py-3 border-b border-[#E5E5E5] flex items-center justify-between bg-[#FAFAFA]">
                                            <span className="text-xs font-semibold uppercase tracking-wider text-[#737373]">Campaign List</span>
                                            <CountPill>{campaigns.length}</CountPill>
                                        </div>

                                        {campaigns.length === 0 ? (
                                            <div className="p-8 text-center text-xs text-[#737373]">
                                                No campaigns found.
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-[#F0F0F0] max-h-[calc(100vh-260px)] overflow-y-auto">
                                                {campaigns.map((camp, idx) => {
                                                    const isCurrentEditing = editingCampaignId === camp.id;
                                                    const isPub = camp.is_published !== false;
                                                    
                                                    return (
                                                        <div 
                                                            key={camp.id || idx}
                                                            className={`p-3.5 transition-colors cursor-pointer group ${
                                                                isCurrentEditing 
                                                                ? 'bg-[#FAFAFA] border-l-2 border-l-black' 
                                                                : 'hover:bg-[#FAFAFA] border-l-2 border-l-transparent'
                                                            }`}
                                                            onClick={() => loadCampaignToForm(camp)}
                                                        >
                                                            <div className="flex gap-3">
                                                                <div className="w-12 h-12 rounded-lg bg-[#F5F5F5] overflow-hidden shrink-0 border border-[#E5E5E5] relative">
                                                                    {camp.image ? (
                                                                        <img src={camp.image} alt="" className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <div className="w-full h-full flex items-center justify-center text-[#A3A3A3]">
                                                                            <Megaphone size={16} />
                                                                        </div>
                                                                    )}
                                                                    {!isPub && (
                                                                        <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center">
                                                                            <span className="text-[9px] font-semibold uppercase text-black">Draft</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center justify-between mb-0.5">
                                                                        <span className="text-[10px] font-mono text-[#737373] uppercase tracking-wider truncate">
                                                                            {camp.label || 'PROMO'}
                                                                        </span>
                                                                        <span className="text-[10px] font-mono text-[#A3A3A3]">
                                                                            #{camp.order ?? (idx + 1)}
                                                                        </span>
                                                                    </div>
                                                                    <h4 className="text-xs font-semibold text-black truncate">
                                                                        {camp.title || 'Untitled'}
                                                                    </h4>
                                                                    
                                                                    <div className="mt-2 flex items-center justify-between opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        <div className="flex items-center gap-1">
                                                                            <button
                                                                                type="button"
                                                                                disabled={idx === 0}
                                                                                onClick={(e) => { e.stopPropagation(); handleMoveCampaign(idx, 'up'); }}
                                                                                className="p-1 rounded text-[#737373] hover:text-black hover:bg-[#F0F0F0] disabled:opacity-30"
                                                                                title="Move up"
                                                                            >
                                                                                <ArrowUp size={12} />
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                disabled={idx === campaigns.length - 1}
                                                                                onClick={(e) => { e.stopPropagation(); handleMoveCampaign(idx, 'down'); }}
                                                                                className="p-1 rounded text-[#737373] hover:text-black hover:bg-[#F0F0F0] disabled:opacity-30"
                                                                                title="Move down"
                                                                            >
                                                                                <ArrowDown size={12} />
                                                                            </button>
                                                                        </div>
                                                                        <div className="flex items-center gap-2">
                                                                            <button
                                                                                type="button"
                                                                                onClick={(e) => { e.stopPropagation(); handleTogglePublishCampaign(camp); }}
                                                                                className="text-[11px] font-medium text-[#737373] hover:text-black"
                                                                            >
                                                                                {isPub ? 'Hide' : 'Publish'}
                                                                            </button>
                                                                            {camp.id && (
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={(e) => { e.stopPropagation(); handleDeleteCampaign(camp.id!); }}
                                                                                    className="text-[#737373] hover:text-red-600 p-1"
                                                                                    title="Delete"
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
                                        <div className="p-3 bg-[#FAFAFA] border-t border-[#E5E5E5] flex flex-col gap-2">
                                            <div className="text-[10px] font-semibold uppercase tracking-wider text-[#737373]">Presets</div>
                                            <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar pb-1">
                                                {CAMPAIGN_PRESETS.map((preset, idx) => (
                                                    <button
                                                        key={idx}
                                                        type="button"
                                                        onClick={() => { applyCampaignPreset(preset); scrollToCampaignForm(); }}
                                                        className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-white border border-[#E5E5E5] text-[#171717] hover:border-black whitespace-nowrap shrink-0 transition-colors"
                                                    >
                                                        {preset.title}
                                                    </button>
                                                ))}
                                                <button
                                                    type="button"
                                                    onClick={handleRestoreDefaultCampaigns}
                                                    className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-[#F5F5F5] border border-[#E5E5E5] text-[#525252] hover:text-black hover:bg-[#E5E5E5] whitespace-nowrap shrink-0 transition-colors ml-auto"
                                                >
                                                    Defaults
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Area: Form & Preview */}
                                <div className="w-full lg:w-2/3 flex flex-col gap-6">
                                    <div className="bg-white border border-[#E5E5E5] rounded-xl shadow-xs overflow-hidden">
                                        <div className="px-5 py-3.5 border-b border-[#E5E5E5] flex items-center justify-between bg-white">
                                            <h3 className="text-sm font-semibold text-black">
                                                {editingCampaignId ? 'Edit Campaign Details' : 'Create New Campaign'}
                                            </h3>
                                            <span className="text-xs text-[#737373]">
                                                Position #{campaignOrder || (editingCampaignId ? 1 : campaigns.length + 1)}
                                            </span>
                                        </div>

                                        <form id="campaign-form" onSubmit={handleSubmit} className="p-5 md:p-6 space-y-5">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                                
                                                {/* Left Column in Form */}
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="block text-xs font-medium text-[#171717] mb-1.5">Headline</label>
                                                        <input 
                                                            type="text" required placeholder="e.g. Summer Package" 
                                                            value={campaignTitle} onChange={e => setCampaignTitle(e.target.value)}
                                                            className={inputCls}
                                                        />
                                                    </div>
                                                    
                                                    <div>
                                                        <label className="block text-xs font-medium text-[#171717] mb-1.5">Badge Label</label>
                                                        <input 
                                                            type="text" required placeholder="e.g. 10% OFF" 
                                                            value={campaignLabel} onChange={e => setCampaignLabel(e.target.value)}
                                                            className={inputCls}
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-xs font-medium text-[#171717] mb-1.5">Description</label>
                                                        <textarea 
                                                            rows={2} placeholder="Brief details about the promo..." 
                                                            value={campaignDesc} onChange={e => setCampaignDesc(e.target.value)}
                                                            className="w-full rounded-lg border border-[#E5E5E5] bg-white px-3 py-2 text-xs text-[#171717] placeholder:text-[#A3A3A3] focus:outline-none focus:border-black focus:ring-1 focus:ring-black resize-none"
                                                        />
                                                    </div>

                                                    <div className="grid grid-cols-3 gap-3">
                                                        <div>
                                                            <label className="block text-xs font-medium text-[#171717] mb-1.5">Discount %</label>
                                                            <input 
                                                                type="number" required min="0" max="100" 
                                                                value={discountPercentage} onChange={e => setDiscountPercentage(Math.max(0, Math.min(100, Number(e.target.value))))}
                                                                className={inputCls}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-[#171717] mb-1.5">Start Date</label>
                                                            <input 
                                                                type="date"
                                                                value={campaignStartDate} onChange={e => setCampaignStartDate(e.target.value)}
                                                                className={inputCls}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-[#171717] mb-1.5">End Date</label>
                                                            <input 
                                                                type="date"
                                                                value={campaignEndDate} onChange={e => setCampaignEndDate(e.target.value)}
                                                                className={inputCls}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Right Column in Form: Preview & Treatments */}
                                                <div className="space-y-4">
                                                    {/* Mini Preview */}
                                                    <div>
                                                        <label className="block text-xs font-medium text-[#171717] mb-1.5">Card Preview</label>
                                                        <div className="relative w-full flex flex-row rounded-xl overflow-hidden shadow-xs group transition-colors duration-300 border border-[#E5E5E5] bg-[#FAFAFA] min-h-[140px]">
                                                            {/* Left Section */}
                                                            <div className="flex-1 bg-black text-white p-4 flex flex-col justify-between relative z-10">
                                                                <div>
                                                                    <div className="inline-flex items-center text-[10px] font-mono tracking-wide uppercase mb-1 text-white/80">
                                                                        {campaignLabel || `${discountPercentage}% OFF`}
                                                                    </div>
                                                                    <h3 className="text-base font-semibold leading-tight mb-1">
                                                                        {campaignTitle || 'Campaign Title'}
                                                                    </h3>
                                                                    {campaignDesc && (
                                                                        <p className="text-white/70 text-[10px] line-clamp-2 leading-relaxed">
                                                                            {campaignDesc}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                                <div className="mt-2 flex items-center">
                                                                    <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-white">
                                                                        <ArrowRight size={10} />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            
                                                            {/* Right Section */}
                                                            <div className="w-[85px] bg-white flex flex-col items-center justify-center py-3 px-2 shrink-0 text-center relative z-10 border-l border-dashed border-[#E5E5E5]">
                                                                <div className="flex flex-col items-center justify-center gap-1.5">
                                                                    <div className="flex flex-col items-center">
                                                                        <div className="text-[8px] font-mono text-[#737373] uppercase tracking-wider mb-0.5">Start</div>
                                                                        {campaignStartDate ? (
                                                                            <>
                                                                                <div className="text-[9px] font-semibold text-black uppercase leading-none">{new Date(campaignStartDate).toLocaleDateString('en-US', { month: 'short' })}</div>
                                                                                <div className="text-base font-bold text-black leading-none my-0.5 tabular-nums">{new Date(campaignStartDate).getDate()}</div>
                                                                            </>
                                                                        ) : (
                                                                            <div className="text-[10px] font-semibold text-black uppercase">NOW</div>
                                                                        )}
                                                                    </div>
                                                                    
                                                                    <div className="w-4 h-px bg-[#E5E5E5]"></div>

                                                                    <div className="flex flex-col items-center">
                                                                        <div className="text-[8px] font-mono text-[#737373] uppercase tracking-wider mb-0.5">End</div>
                                                                        {campaignEndDate ? (
                                                                            <>
                                                                                <div className="text-[9px] font-semibold text-black uppercase leading-none">{new Date(campaignEndDate).toLocaleDateString('en-US', { month: 'short' })}</div>
                                                                                <div className="text-base font-bold text-black leading-none my-0.5 tabular-nums">{new Date(campaignEndDate).getDate()}</div>
                                                                            </>
                                                                        ) : (
                                                                            <div className="text-[9px] font-semibold text-black uppercase">{campaignDuration.replace('_', ' ')}</div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <div className="flex items-center justify-between mb-1.5">
                                                            <label className="block text-xs font-medium text-[#171717]">Eligible Treatments</label>
                                                            <div className="flex gap-2">
                                                                <button type="button" onClick={selectAllTreatments} className="text-[11px] font-medium text-black hover:underline">Select All</button>
                                                                <button type="button" onClick={clearAllCampaignTreatments} className="text-[11px] font-medium text-[#737373] hover:underline">Clear</button>
                                                            </div>
                                                        </div>
                                                        <div className="h-36 overflow-y-auto border border-[#E5E5E5] rounded-lg p-2 space-y-1.5 bg-[#FAFAFA]">
                                                            {treatments.map((t) => {
                                                                const selectedT = campaignTreatments.find(ct => ct.treatmentId === t.id);
                                                                return (
                                                                    <div key={t.id} className="bg-white border border-[#E5E5E5] p-2 rounded-lg text-xs">
                                                                        <div className="font-semibold text-xs text-black mb-1">{t.title}</div>
                                                                        <div className="flex flex-wrap gap-1">
                                                                            {t.options.map(opt => {
                                                                                const isSelected = selectedT?.durations.includes(opt.duration);
                                                                                return (
                                                                                    <button
                                                                                        type="button"
                                                                                        key={opt.duration}
                                                                                        onClick={() => toggleCampaignTreatmentDuration(t.id, opt.duration)}
                                                                                        className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                                                                                            isSelected ? 'bg-black border border-black text-white' : 'bg-white border border-[#E5E5E5] text-[#525252] hover:border-black hover:text-black'
                                                                                        }`}
                                                                                    >
                                                                                        {opt.duration}m
                                                                                    </button>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="pt-4 border-t border-[#E5E5E5] flex items-center justify-between">
                                                {success ? (
                                                    <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                                                        <CheckCircle size={14} /> Saved successfully
                                                    </span>
                                                ) : <div/>}
                                                
                                                <div className="flex gap-2">
                                                    {editingCampaignId && (
                                                        <button
                                                            type="button"
                                                            onClick={handleNewCampaign}
                                                            className={cx(btn.base, btn.secondary, btn.sm)}
                                                        >
                                                            Cancel
                                                        </button>
                                                    )}
                                                    <button
                                                        type="submit"
                                                        disabled={isSubmitting}
                                                        className={cx(btn.base, btn.primary, btn.md)}
                                                    >
                                                        {isSubmitting ? 'Saving...' : (editingCampaignId ? 'Save Changes' : 'Publish Campaign')}
                                                    </button>
                                                </div>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TREATMENT CREATION TAB */}
                    {/* PROMO CODES TAB */}
                    {activeTab === 'promo' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            {/* Header */}
                            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-black">Promo Codes</h1>
                                    <p className="text-[13px] text-[#737373] mt-0.5">Create discount voucher codes and track redemption limits</p>
                                </div>
                            </header>

                            {/* Summary metrics */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 border border-[#E5E5E5] rounded-xl divide-[#E5E5E5] [&>*]:border-[#E5E5E5] overflow-hidden">
                                <div className="p-4 bg-white">
                                    <div className="text-xs text-[#737373]">Total codes</div>
                                    <div className="text-lg md:text-xl font-semibold text-black mt-1 tabular-nums">{promoCodes.length}</div>
                                    <div className="text-[11px] text-[#A3A3A3] mt-0.5">Vouchers created</div>
                                </div>
                                <div className="p-4 bg-white border-l">
                                    <div className="text-xs text-[#737373]">Active codes</div>
                                    <div className="text-lg md:text-xl font-semibold text-emerald-600 mt-1 tabular-nums">
                                        {promoCodes.filter((p) => p.is_active).length}
                                    </div>
                                    <div className="text-[11px] text-[#A3A3A3] mt-0.5">Ready for checkout</div>
                                </div>
                                <div className="p-4 bg-white border-t lg:border-t-0 lg:border-l">
                                    <div className="text-xs text-[#737373]">Inactive codes</div>
                                    <div className="text-lg md:text-xl font-semibold text-black mt-1 tabular-nums">
                                        {promoCodes.filter((p) => !p.is_active).length}
                                    </div>
                                    <div className="text-[11px] text-[#A3A3A3] mt-0.5">Paused vouchers</div>
                                </div>
                                <div className="p-4 bg-white border-t lg:border-t-0 border-l">
                                    <div className="text-xs text-[#737373]">Total redemptions</div>
                                    <div className="text-lg md:text-xl font-semibold text-black mt-1 tabular-nums">
                                        {promoCodes.reduce((acc, p) => acc + (p.current_uses || 0), 0)}
                                    </div>
                                    <div className="text-[11px] text-[#A3A3A3] mt-0.5">Times redeemed</div>
                                </div>
                            </div>

                            {/* Create Promo Code Form */}
                            <form onSubmit={handlePromoSubmit} className="bg-white border border-[#E5E5E5] rounded-xl p-5 md:p-6 shadow-xs space-y-5">
                                <div className="border-b border-[#E5E5E5] pb-3">
                                    <h3 className="text-sm font-semibold text-black">Create Promo Code</h3>
                                    <p className="text-xs text-[#737373] mt-0.5">Configure voucher code string, discount rate, and usage ceiling</p>
                                </div>
                                
                                {success && (
                                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2.5 text-emerald-800 text-xs font-medium">
                                        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                                        <span>Promo code created successfully.</span>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-[#171717] mb-1.5">Promo Code</label>
                                        <input 
                                            type="text" required placeholder="e.g. SUMMER20"
                                            value={promoForm.code} onChange={e => setPromoForm({...promoForm, code: e.target.value.toUpperCase()})}
                                            className={cx(inputCls, 'uppercase font-mono')}
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-xs font-medium text-[#171717] mb-1.5">Discount Type</label>
                                        <select 
                                            value={promoForm.discount_type} onChange={e => setPromoForm({...promoForm, discount_type: e.target.value})}
                                            className={selectCls}
                                        >
                                            <option value="percentage">Percentage (%)</option>
                                            <option value="fixed">Fixed Amount (IDR)</option>
                                        </select>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-xs font-medium text-[#171717] mb-1.5">Discount Value</label>
                                        <input 
                                            type="number" required min="0" placeholder="e.g. 20"
                                            value={promoForm.discount_value || ''} onChange={e => setPromoForm({...promoForm, discount_value: parseFloat(e.target.value) || 0})}
                                            className={inputCls}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-[#171717] mb-1.5">Max Uses (0 = unlimited)</label>
                                        <input 
                                            type="number" required min="0" placeholder="e.g. 100"
                                            value={promoForm.max_uses || ''} onChange={e => setPromoForm({...promoForm, max_uses: parseInt(e.target.value) || 0})}
                                            className={inputCls}
                                        />
                                    </div>
                                </div>
                                
                                <div className="pt-3 border-t border-[#E5E5E5] flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={isPromoFormLoading}
                                        className={cx(btn.base, btn.primary, btn.md)}
                                    >
                                        {isPromoFormLoading ? 'Saving...' : 'Create Promo Code'}
                                    </button>
                                </div>
                            </form>

                            {/* Active Promo Codes Table */}
                            <div className="bg-white border border-[#E5E5E5] rounded-xl overflow-hidden shadow-xs">
                                <div className="px-5 py-3.5 border-b border-[#E5E5E5] flex items-center justify-between bg-[#FAFAFA]">
                                    <span className="text-xs font-semibold uppercase tracking-wider text-[#737373]">Active Promo Codes</span>
                                    <CountPill>{promoCodes.length}</CountPill>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-[#FAFAFA] border-b border-[#E5E5E5]">
                                            <tr>
                                                <th className={thCls}>Code</th>
                                                <th className={thCls}>Discount</th>
                                                <th className={thCls}>Uses</th>
                                                <th className={thCls}>Status</th>
                                                <th className={cx(thCls, 'text-right')}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#F0F0F0]">
                                            {promoCodes.map(promo => (
                                                <tr key={promo.id} className="hover:bg-[#FAFAFA] transition-colors">
                                                    <td className={tdCls}>
                                                        <span className="font-mono text-xs font-semibold text-black">{promo.code}</span>
                                                    </td>
                                                    <td className={tdCls}>
                                                        <span className="font-medium text-xs text-black tabular-nums">
                                                            {promo.discount_type === 'percentage' ? `${promo.discount_value}%` : `IDR ${promo.discount_value.toLocaleString()}`}
                                                        </span>
                                                    </td>
                                                    <td className={tdCls}>
                                                        <span className="text-xs text-[#737373] tabular-nums">
                                                            {promo.current_uses} / {promo.max_uses === 0 ? '∞' : promo.max_uses}
                                                        </span>
                                                    </td>
                                                    <td className={tdCls}>
                                                        <button 
                                                            type="button"
                                                            onClick={() => togglePromo(promo.id, promo.is_active)}
                                                            className="cursor-pointer"
                                                            title="Toggle status"
                                                        >
                                                            <StatusBadge status={promo.is_active ? 'active' : 'inactive'} />
                                                        </button>
                                                    </td>
                                                    <td className={cx(tdCls, 'text-right')}>
                                                        <button 
                                                            type="button"
                                                            onClick={() => deletePromo(promo.id)} 
                                                            className={cx(btn.base, btn.danger, btn.xs)}
                                                            title="Delete promo code"
                                                        >
                                                            <Trash2 size={13} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {promoCodes.length === 0 && (
                                                <tr>
                                                    <td colSpan={5} className="py-12 text-center text-xs text-[#737373]">
                                                        No promo codes created yet.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'treatment' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            {/* Page Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#E5E5E5]">
                                <div>
                                    <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-black">
                                        {editingTreatmentId ? 'Edit Treatment' : 'Add Spa Treatment'}
                                    </h1>
                                    <p className="text-[13px] text-[#737373] mt-0.5">
                                        {editingTreatmentId ? 'Update treatment details, pricing tiers, and service benefits.' : 'Create a new massage, facial, ritual, or package for the booking system.'}
                                    </p>
                                </div>
                                {editingTreatmentId && (
                                    <button 
                                        type="button" 
                                        onClick={() => {
                                            setEditingTreatmentId(null);
                                            setTreatmentTitle('');
                                            setTreatmentDesc('');
                                            setBenefits(['']);
                                            setPricingOptions([{ duration: '', price: '' }]);
                                        }}
                                        className={cx(btn.base, btn.secondary, btn.sm)}
                                    >
                                        Cancel Edit
                                    </button>
                                )}
                            </div>

                            {/* Treatment Form Card */}
                            <form id="treatment-form" onSubmit={handleSubmit} className="bg-white border border-[#E5E5E5] rounded-xl p-5 md:p-6 shadow-xs space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-medium text-[#171717] mb-1.5 block">Treatment Title</label>
                                        <input 
                                            type="text" required placeholder="e.g. Traditional Balinese Massage" 
                                            value={treatmentTitle} onChange={e => setTreatmentTitle(e.target.value)}
                                            className={inputCls}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-[#171717] mb-1.5 block">Category</label>
                                        <select 
                                            value={treatmentCategory} onChange={e => setTreatmentCategory(e.target.value)}
                                            className={selectCls}
                                        >
                                            <option value="massage">Massage</option>
                                            <option value="facial">Facial</option>
                                            <option value="package">Package</option>
                                            <option value="ritual">Ritual</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Duration & Pricing */}
                                <div className="space-y-3 pt-2 border-t border-[#E5E5E5]">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#737373]">Duration & Pricing</h4>
                                            <p className="text-[11px] text-[#A3A3A3] mt-0.5">Define duration options and prices in IDR</p>
                                        </div>
                                        <button type="button" onClick={handleAddPricing} className={cx(btn.base, btn.secondary, btn.xs)}>
                                            <Plus size={13} /> Add Option
                                        </button>
                                    </div>
                                    <div className="space-y-2.5">
                                        {pricingOptions.map((option, idx) => (
                                            <div key={idx} className="flex items-center gap-3">
                                                <div className="w-36 relative">
                                                    <input 
                                                        type="number" required placeholder="60" value={option.duration} onChange={(e) => handlePricingChange(idx, 'duration', e.target.value)}
                                                        className={cx(inputCls, "pr-12")}
                                                    />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-[#737373] pointer-events-none">MINS</span>
                                                </div>
                                                <div className="flex-1 relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-[#737373] pointer-events-none">Rp</span>
                                                    <input 
                                                        type="text" required placeholder="450,000" value={option.price} onChange={(e) => handlePricingChange(idx, 'price', e.target.value)}
                                                        className={cx(inputCls, "pl-9")}
                                                    />
                                                </div>
                                                {pricingOptions.length > 1 && (
                                                    <button type="button" onClick={() => handleRemovePricing(idx)} className={cx(btn.base, btn.secondary, btn.xs, "text-[#737373] hover:text-rose-600")}>
                                                        <Trash2 size={15} />
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
                                        required rows={3} placeholder="Write details about the treatment, technique, and wellness effects..." 
                                        value={treatmentDesc} onChange={e => setTreatmentDesc(e.target.value)}
                                        className="w-full bg-white border border-[#E5E5E5] rounded-lg px-3 py-2 text-xs text-black placeholder:text-[#A3A3A3] focus:outline-none focus:border-black transition-colors resize-none"
                                    />
                                </div>

                                {/* Benefits */}
                                <div className="space-y-3 pt-2 border-t border-[#E5E5E5]">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#737373]">Key Benefits</h4>
                                            <p className="text-[11px] text-[#A3A3A3] mt-0.5">Highlights displayed on the treatment card</p>
                                        </div>
                                        <button type="button" onClick={handleAddBenefit} className={cx(btn.base, btn.secondary, btn.xs)}>
                                            <Plus size={13} /> Add Benefit
                                        </button>
                                    </div>
                                    <div className="space-y-2.5">
                                        {benefits.map((b, idx) => (
                                            <div key={idx} className="flex items-center gap-3">
                                                <input 
                                                    type="text" required placeholder="e.g. Deep relaxation & stress relief" value={b} onChange={(e) => handleBenefitChange(idx, e.target.value)}
                                                    className={inputCls}
                                                />
                                                {benefits.length > 1 && (
                                                    <button type="button" onClick={() => handleRemoveBenefit(idx)} className={cx(btn.base, btn.secondary, btn.xs, "text-[#737373] hover:text-rose-600")}>
                                                        <Trash2 size={15} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-[#E5E5E5] flex justify-end">
                                    <button type="submit" disabled={isSubmitting} className={cx(btn.base, btn.primary, btn.md)}>
                                        {isSubmitting ? 'Saving...' : editingTreatmentId ? 'Update Treatment' : 'Create Treatment'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* STORE PRODUCTS TAB */}
                    {activeTab === 'store' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            {/* Page Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#E5E5E5]">
                                <div>
                                    <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-black">
                                        {editingProductId ? 'Edit Store Product' : 'Store Products'}
                                    </h1>
                                    <p className="text-[13px] text-[#737373] mt-0.5">
                                        Manage retail wellness products, massage oils, and spa amenities.
                                    </p>
                                </div>
                                {editingProductId && (
                                    <button 
                                        type="button" 
                                        onClick={() => {
                                            setEditingProductId(null);
                                            setProductTitle('');
                                            setProductPrice('');
                                            setProductDesc('');
                                        }}
                                        className={cx(btn.base, btn.secondary, btn.sm)}
                                    >
                                        Cancel Edit
                                    </button>
                                )}
                            </div>

                            {/* Metrics Strip */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 border border-[#E5E5E5] rounded-xl divide-y sm:divide-y-0 sm:divide-x divide-[#E5E5E5] bg-white overflow-hidden shadow-xs">
                                <div className="p-4 sm:p-5">
                                    <div className="text-[11px] font-semibold uppercase tracking-wider text-[#737373]">Total Products</div>
                                    <div className="text-xl sm:text-2xl font-semibold tracking-tight text-black mt-1">{products.length}</div>
                                    <div className="text-[11px] text-[#737373] mt-0.5">In catalog</div>
                                </div>
                                <div className="p-4 sm:p-5">
                                    <div className="text-[11px] font-semibold uppercase tracking-wider text-[#737373]">Brand Scope</div>
                                    <div className="text-xl sm:text-2xl font-semibold tracking-tight text-black mt-1 capitalize">{siteBrandFilter}</div>
                                    <div className="text-[11px] text-[#737373] mt-0.5">Active catalogue</div>
                                </div>
                                <div className="p-4 sm:p-5">
                                    <div className="text-[11px] font-semibold uppercase tracking-wider text-[#737373]">Default Stock</div>
                                    <div className="text-xl sm:text-2xl font-semibold tracking-tight text-black mt-1">10 units</div>
                                    <div className="text-[11px] text-[#737373] mt-0.5">Per new listing</div>
                                </div>
                                <div className="p-4 sm:p-5">
                                    <div className="text-[11px] font-semibold uppercase tracking-wider text-[#737373]">Mode</div>
                                    <div className="text-xl sm:text-2xl font-semibold tracking-tight text-black mt-1">{editingProductId ? 'Editing' : 'Create'}</div>
                                    <div className="text-[11px] text-[#737373] mt-0.5">Product form status</div>
                                </div>
                            </div>

                            {/* Product Form Card */}
                            <form onSubmit={handleSubmit} className="bg-white border border-[#E5E5E5] rounded-xl p-5 md:p-6 shadow-xs space-y-4">
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#737373]">
                                    {editingProductId ? 'Edit Product Details' : 'Add New Product'}
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-medium text-[#171717] mb-1.5 block">Product Title</label>
                                        <input 
                                            type="text" required placeholder="e.g. Organic Coconut Massage Oil" 
                                            value={productTitle} onChange={e => setProductTitle(e.target.value)}
                                            className={inputCls}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-[#171717] mb-1.5 block">Price (IDR)</label>
                                        <input 
                                            type="text" required placeholder="185,000" 
                                            value={productPrice} onChange={e => setProductPrice(e.target.value)}
                                            className={inputCls}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-medium text-[#171717] mb-1.5 block">Product Description</label>
                                    <textarea 
                                        required rows={3} placeholder="Product details, botanical ingredients, and benefits..." 
                                        value={productDesc} onChange={e => setProductDesc(e.target.value)}
                                        className="w-full bg-white border border-[#E5E5E5] rounded-lg px-3 py-2 text-xs text-black placeholder:text-[#A3A3A3] focus:outline-none focus:border-black transition-colors resize-none"
                                    />
                                </div>

                                <div className="pt-4 border-t border-[#E5E5E5] flex justify-end">
                                    <button type="submit" disabled={isSubmitting} className={cx(btn.base, btn.primary, btn.md)}>
                                        {isSubmitting ? 'Saving...' : editingProductId ? 'Update Product' : 'Add Product'}
                                    </button>
                                </div>
                            </form>

                            {/* Existing Products Table */}
                            <div className="border border-[#E5E5E5] rounded-xl overflow-hidden bg-white shadow-xs">
                                <div className="px-5 py-4 border-b border-[#E5E5E5] flex items-center justify-between">
                                    <div>
                                        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#737373]">Product Inventory</h3>
                                        <p className="text-[11px] text-[#A3A3A3] mt-0.5">All products currently active in the store</p>
                                    </div>
                                    <CountPill>{products.length}</CountPill>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-[#FAFAFA] border-b border-[#E5E5E5]">
                                            <tr>
                                                <th className={thCls}>Product Name</th>
                                                <th className={thCls}>Price</th>
                                                <th className={thCls}>Description</th>
                                                <th className={cx(thCls, "text-right")}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#E5E5E5]">
                                            {products.length > 0 ? (
                                                products.map((p) => (
                                                    <tr key={p.id} className="hover:bg-[#FAFAFA] transition-colors">
                                                        <td className={cx(tdCls, "font-semibold text-black")}>
                                                            {p.title}
                                                        </td>
                                                        <td className={tdCls}>
                                                            <span className="font-semibold text-black">
                                                                Rp {parseInt((p.price || '0').toString().replace(/,/g, '')).toLocaleString()}
                                                            </span>
                                                        </td>
                                                        <td className={cx(tdCls, "text-[#737373] max-w-xs truncate")}>
                                                            {p.description || '-'}
                                                        </td>
                                                        <td className={cx(tdCls, "text-right")}>
                                                            <div className="flex items-center justify-end gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setEditingProductId(p.id);
                                                                        setProductTitle(p.title);
                                                                        setProductPrice(p.price);
                                                                        setProductDesc(p.description || '');
                                                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                                                    }}
                                                                    className={cx(btn.base, btn.secondary, btn.xs)}
                                                                >
                                                                    <Edit3 size={13} /> Edit
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={async () => {
                                                                        if (confirm(`Delete "${p.title}"?`)) {
                                                                            await supabase.from('products').delete().eq('id', p.id);
                                                                            setProducts(prev => prev.filter(x => x.id !== p.id));
                                                                        }
                                                                    }}
                                                                    className={cx(btn.base, btn.danger, btn.xs)}
                                                                >
                                                                    <Trash2 size={13} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={4} className="py-12 text-center text-xs text-[#737373]">
                                                        No store products yet. Create one using the form above.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}                    {/* THERAPIST FEES TAB */}
                    {activeTab === 'fees' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            {/* Page Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#E5E5E5]">
                                <div>
                                    <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-black">
                                        Therapist Fee Setup
                                    </h1>
                                    <p className="text-[13px] text-[#737373] mt-0.5">
                                        Configure wage payouts per treatment duration tier for therapists.
                                    </p>
                                </div>
                                <div className="w-full sm:w-64">
                                    <SearchInput
                                        id="fee-search-input"
                                        value={feeSearch}
                                        onChange={setFeeSearch}
                                        placeholder="Search treatments..."
                                    />
                                </div>
                            </div>

                            {/* Metrics Strip */}
                            <div className="grid grid-cols-2 lg:grid-cols-3 border border-[#E5E5E5] rounded-xl divide-y sm:divide-y-0 sm:divide-x divide-[#E5E5E5] bg-white overflow-hidden shadow-xs">
                                <div className="p-4 sm:p-5">
                                    <div className="text-[11px] font-semibold uppercase tracking-wider text-[#737373]">Total Treatments</div>
                                    <div className="text-xl sm:text-2xl font-semibold tracking-tight text-black mt-1">{treatments.length}</div>
                                    <div className="text-[11px] text-[#737373] mt-0.5">In current brand catalog</div>
                                </div>
                                <div className="p-4 sm:p-5">
                                    <div className="text-[11px] font-semibold uppercase tracking-wider text-[#737373]">Wage Tiers Set</div>
                                    <div className="text-xl sm:text-2xl font-semibold tracking-tight text-black mt-1">{therapistFees.length}</div>
                                    <div className="text-[11px] text-[#737373] mt-0.5">Custom payouts defined</div>
                                </div>
                                <div className="p-4 sm:p-5 col-span-2 lg:col-span-1">
                                    <div className="text-[11px] font-semibold uppercase tracking-wider text-[#737373]">Active Brand</div>
                                    <div className="text-xl sm:text-2xl font-semibold tracking-tight text-black mt-1 capitalize">{siteBrandFilter}</div>
                                    <div className="text-[11px] text-[#737373] mt-0.5">Filtered scope</div>
                                </div>
                            </div>

                            {/* Treatment Fee Cards Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {treatments.filter(t => t.title.toLowerCase().includes(feeSearch.toLowerCase())).map(t => (
                                    <div key={t.id} className="bg-white border border-[#E5E5E5] rounded-xl p-5 shadow-xs hover:border-[#D4D4D4] transition-all flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-start gap-2 mb-3">
                                                <h4 className="font-semibold text-black text-sm">{t.title}</h4>
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#F5F5F5] text-[#525252] border border-[#E5E5E5] capitalize shrink-0">
                                                    {t.category}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="border border-[#E5E5E5] rounded-lg overflow-hidden bg-white">
                                                <table className="w-full text-left text-xs">
                                                    <thead className="bg-[#FAFAFA] border-b border-[#E5E5E5]">
                                                        <tr>
                                                            <th className={thCls}>Duration</th>
                                                            <th className={cx(thCls, "text-right")}>Fee (IDR)</th>
                                                            <th className={cx(thCls, "text-right")}></th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-[#E5E5E5]">
                                                        {t.options.map(opt => {
                                                            const isEditing = editingFee?.id === t.id && editingFee?.duration === opt.duration;
                                                            const feeObj = therapistFees.find(f => f.treatment_id === t.id && f.duration === opt.duration);
                                                            const feeValue = feeObj ? parseInt(feeObj.fee.replace(/,/g, '') || '0').toLocaleString('en-US') : '-';
                                                            
                                                            return (
                                                                <tr key={opt.duration} className="hover:bg-[#FAFAFA] transition-colors">
                                                                    <td className={cx(tdCls, "font-medium text-black")}>{opt.duration} mins</td>
                                                                    <td className={cx(tdCls, "font-semibold text-black text-right")}>
                                                                        {isEditing ? (
                                                                            <input 
                                                                                type="text"
                                                                                autoFocus
                                                                                placeholder="e.g. 150,000"
                                                                                value={feeInputs[`${t.id}-${opt.duration}`] || ''}
                                                                                onChange={e => setFeeInputs({ ...feeInputs, [`${t.id}-${opt.duration}`]: e.target.value })}
                                                                                className={cx(inputCls, "h-7 text-xs text-right py-0.5 px-2 w-24 inline-block")}
                                                                            />
                                                                        ) : (
                                                                            feeValue
                                                                        )}
                                                                    </td>
                                                                    <td className={cx(tdCls, "text-right")}>
                                                                        <div className="flex items-center justify-end gap-1.5">
                                                                            {isEditing ? (
                                                                                <>
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => handleSaveFee(t.id, opt.duration)}
                                                                                        className={cx(btn.base, btn.primary, btn.xs)}
                                                                                    >
                                                                                        Save
                                                                                    </button>
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => setEditingFee(null)}
                                                                                        className={cx(btn.base, btn.secondary, btn.xs)}
                                                                                    >
                                                                                        Cancel
                                                                                    </button>
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => {
                                                                                            setFeeInputs(prev => ({ ...prev, [`${t.id}-${opt.duration}`]: feeObj ? feeObj.fee : '' }));
                                                                                            setEditingFee({ id: t.id, duration: opt.duration });
                                                                                        }}
                                                                                        className={cx(btn.base, btn.secondary, btn.xs)}
                                                                                    >
                                                                                        {feeObj ? <Edit3 size={13} /> : <span className="text-[10px]">+ Add</span>}
                                                                                    </button>
                                                                                    {feeObj && (
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => handleDeleteFee(t.id, opt.duration)}
                                                                                            className={cx(btn.base, btn.danger, btn.xs)}
                                                                                        >
                                                                                            <Trash2 size={13} />
                                                                                        </button>
                                                                                    )}
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* COMMISSION CALCULATOR TAB */}
                    {activeTab === 'calculator' && (() => {
                        const calcTotals = calculations.reduce((acc, calc) => {
                            const tr = treatments.find(t => t.id === calc.treatmentId);
                            const opt = tr?.options.find(o => o.duration === calc.duration);
                            const priceNum = opt ? parseInt(opt.price.replace(/,/g, '')) : 0;
                            const feeObj = therapistFees.find(f => f.treatment_id === calc.treatmentId && f.duration === calc.duration);
                            const feeStr = feeInputs[`${calc.treatmentId}-${calc.duration}`] || (feeObj ? feeObj.fee : '0');
                            const feeNum = parseInt(feeStr.replace(/,/g, '')) || 0;
                            const isCouple = tr?.title?.toLowerCase().includes('couple');
                            const multiplier = isCouple ? 2 : 1;
                            const totalRevenue = priceNum * calc.treatmentsCount;
                            const totalWage = feeNum * calc.treatmentsCount * multiplier;
                            const netMargin = totalRevenue - totalWage;
                            return {
                                revenue: acc.revenue + totalRevenue,
                                wages: acc.wages + totalWage,
                                net: acc.net + netMargin
                            };
                        }, { revenue: 0, wages: 0, net: 0 });

                        return (
                            <div className="space-y-6 animate-in fade-in duration-300">
                                {/* Page Header */}
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#E5E5E5]">
                                    <div>
                                        <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-black">
                                            Commission & Profit Calculator
                                        </h1>
                                        <p className="text-[13px] text-[#737373] mt-0.5">
                                            Simulate booking service revenue, therapist fee splits, and net spa margin.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (treatments.length > 0) {
                                                const firstT = treatments[0];
                                                setCalculations(prev => [...prev, {
                                                    id: Date.now().toString(),
                                                    treatmentId: firstT.id,
                                                    duration: firstT.options[0]?.duration || '60',
                                                    treatmentsCount: 1,
                                                    therapistsCount: 1,
                                                    showAdvanced: false
                                                }]);
                                            }
                                        }}
                                        className={cx(btn.base, btn.primary, btn.sm)}
                                    >
                                        <Plus size={14} /> Add Row
                                    </button>
                                </div>

                                {/* Summary Strip */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 border border-[#E5E5E5] rounded-xl divide-y sm:divide-y-0 sm:divide-x divide-[#E5E5E5] bg-white overflow-hidden shadow-xs">
                                    <div className="p-4 sm:p-5">
                                        <div className="text-[11px] font-semibold uppercase tracking-wider text-[#737373]">Simulated Revenue</div>
                                        <div className="text-xl sm:text-2xl font-semibold tracking-tight text-black mt-1">
                                            Rp {calcTotals.revenue.toLocaleString()}
                                        </div>
                                        <div className="text-[11px] text-[#737373] mt-0.5">Gross guest billings</div>
                                    </div>
                                    <div className="p-4 sm:p-5">
                                        <div className="text-[11px] font-semibold uppercase tracking-wider text-[#737373]">Therapist Payouts</div>
                                        <div className="text-xl sm:text-2xl font-semibold tracking-tight text-black mt-1">
                                            Rp {calcTotals.wages.toLocaleString()}
                                        </div>
                                        <div className="text-[11px] text-[#737373] mt-0.5">Calculated therapist wages</div>
                                    </div>
                                    <div className="p-4 sm:p-5">
                                        <div className="text-[11px] font-semibold uppercase tracking-wider text-[#737373]">Net Spa Profit</div>
                                        <div className="text-xl sm:text-2xl font-semibold tracking-tight text-emerald-600 mt-1">
                                            Rp {calcTotals.net.toLocaleString()}
                                        </div>
                                        <div className="text-[11px] text-[#737373] mt-0.5">Estimated gross margin</div>
                                    </div>
                                </div>

                                {/* Calculation Rows Card */}
                                <div className="bg-white border border-[#E5E5E5] rounded-xl p-5 md:p-6 shadow-xs space-y-4">
                                    <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E5]">
                                        <div>
                                            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#737373]">Calculation Breakdown</h3>
                                            <p className="text-[11px] text-[#A3A3A3] mt-0.5">Configure treatment, duration, and quantity per item</p>
                                        </div>
                                        <CountPill>{calculations.length}</CountPill>
                                    </div>

                                    {calculations.length > 0 ? (
                                        <div className="space-y-3">
                                            {calculations.map((calc) => {
                                                const tr = treatments.find(t => t.id === calc.treatmentId);
                                                const opt = tr?.options.find(o => o.duration === calc.duration);
                                                const priceNum = opt ? parseInt(opt.price.replace(/,/g, '')) : 0;
                                                const feeObj = therapistFees.find(f => f.treatment_id === calc.treatmentId && f.duration === calc.duration);
                                                const feeStr = feeInputs[`${calc.treatmentId}-${calc.duration}`] || (feeObj ? feeObj.fee : '0');
                                                const feeNum = parseInt(feeStr.replace(/,/g, '')) || 0;
                                                const isCouple = tr?.title?.toLowerCase().includes('couple');
                                                const multiplier = isCouple ? 2 : 1;
                                                const totalRevenue = priceNum * calc.treatmentsCount;
                                                const totalWage = feeNum * calc.treatmentsCount * multiplier;
                                                const netMargin = totalRevenue - totalWage;

                                                return (
                                                    <div key={calc.id} className="p-4 rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-[#D4D4D4] transition-all">
                                                        <div className="flex flex-wrap items-center gap-3">
                                                            <select
                                                                value={calc.treatmentId}
                                                                onChange={e => {
                                                                    const newTId = e.target.value;
                                                                    const newT = treatments.find(t => t.id === newTId);
                                                                    setCalculations(prev => prev.map(c => c.id === calc.id ? { ...c, treatmentId: newTId, duration: newT?.options[0]?.duration || '60' } : c));
                                                                }}
                                                                className={selectCls}
                                                            >
                                                                {treatments.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                                                            </select>

                                                            <select
                                                                value={calc.duration}
                                                                onChange={e => setCalculations(prev => prev.map(c => c.id === calc.id ? { ...c, duration: e.target.value } : c))}
                                                                className={selectCls}
                                                            >
                                                                {tr?.options.map(o => <option key={o.duration} value={o.duration}>{o.duration} Mins</option>)}
                                                            </select>

                                                            <div className="flex items-center gap-1.5 text-xs">
                                                                <span className="text-[#737373] font-medium">Qty:</span>
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    value={calc.treatmentsCount}
                                                                    onChange={e => setCalculations(prev => prev.map(c => c.id === calc.id ? { ...c, treatmentsCount: Number(e.target.value) } : c))}
                                                                    className={cx(inputCls, "w-16 text-center py-1")}
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center justify-between md:justify-end gap-5">
                                                            <div className="text-right">
                                                                <div className="text-xs font-semibold text-black">
                                                                    Revenue: Rp {totalRevenue.toLocaleString()}
                                                                </div>
                                                                <div className="text-[11px] text-[#737373] mt-0.5">
                                                                    Wage: Rp {totalWage.toLocaleString()} &middot; Net: <span className="font-semibold text-emerald-600">Rp {netMargin.toLocaleString()}</span>
                                                                </div>
                                                            </div>

                                                            <button
                                                                type="button"
                                                                onClick={() => setCalculations(prev => prev.filter(c => c.id !== calc.id))}
                                                                className={cx(btn.base, btn.secondary, btn.xs, "text-[#737373] hover:text-rose-600")}
                                                            >
                                                                <Trash2 size={15} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <EmptyState
                                            title="No calculation rows"
                                            description="Click '+ Add Row' to simulate service revenue and wage payouts."
                                        />
                                    )}
                                </div>
                            </div>
                        );
                    })()}

                    {/* OVERVIEW TAB */}
                    {activeTab === 'list' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            {/* Page Header */}
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
                                    <div className="w-full sm:w-64">
                                        <SearchInput
                                            id="menu-search-input"
                                            value={menuSearch}
                                            onChange={setMenuSearch}
                                            placeholder="Search treatments..."
                                        />
                                    </div>
                                    <button 
                                        onClick={() => {
                                            setEditingTreatmentId(null);
                                            setTreatmentTitle('');
                                            setTreatmentDesc('');
                                            setBenefits(['']);
                                            setPricingOptions([{ duration: '', price: '' }]);
                                            setActiveTab('treatment');
                                        }}
                                        className={cx(btn.base, btn.primary, btn.sm, "whitespace-nowrap")}
                                    >
                                        <PlusCircle size={15} /> Add Treatment
                                    </button>
                                </div>
                            </div>

                            {/* Metrics Strip */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 border border-[#E5E5E5] rounded-xl divide-y sm:divide-y-0 sm:divide-x divide-[#E5E5E5] bg-white overflow-hidden shadow-xs">
                                <div className="p-4 sm:p-5">
                                    <div className="text-[11px] font-semibold uppercase tracking-wider text-[#737373]">Total Treatments</div>
                                    <div className="text-xl sm:text-2xl font-semibold tracking-tight text-black mt-1">{treatments.length}</div>
                                    <div className="text-[11px] text-[#737373] mt-0.5">In current catalog</div>
                                </div>
                                <div className="p-4 sm:p-5">
                                    <div className="text-[11px] font-semibold uppercase tracking-wider text-[#737373]">Pinned Most Booked</div>
                                    <div className="text-xl sm:text-2xl font-semibold tracking-tight text-black mt-1">
                                        {treatments.filter(t => t.is_pinned).length}
                                    </div>
                                    <div className="text-[11px] text-[#737373] mt-0.5">Featured on booking menu</div>
                                </div>
                                <div className="p-4 sm:p-5">
                                    <div className="text-[11px] font-semibold uppercase tracking-wider text-[#737373]">Categories</div>
                                    <div className="text-xl sm:text-2xl font-semibold tracking-tight text-black mt-1">
                                        {new Set(treatments.map(t => t.category)).size}
                                    </div>
                                    <div className="text-[11px] text-[#737373] mt-0.5">Unique ritual types</div>
                                </div>
                                <div className="p-4 sm:p-5">
                                    <div className="text-[11px] font-semibold uppercase tracking-wider text-[#737373]">Brand Scope</div>
                                    <div className="text-xl sm:text-2xl font-semibold tracking-tight text-black mt-1 capitalize">{siteBrandFilter}</div>
                                    <div className="text-[11px] text-[#737373] mt-0.5">Active catalogue</div>
                                </div>
                            </div>

                            {/* Grid of Treatments */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {treatments.filter(t => t.title.toLowerCase().includes(menuSearch.toLowerCase()) || t.category.toLowerCase().includes(menuSearch.toLowerCase())).map(t => (
                                    <div key={t.id} className="bg-white border border-[#E5E5E5] rounded-xl p-5 shadow-xs hover:border-[#D4D4D4] transition-all flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-start gap-2 mb-2">
                                                <h4 className="font-semibold text-black text-sm pr-2">{t.title}</h4>
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#F5F5F5] text-[#525252] border border-[#E5E5E5] capitalize shrink-0">
                                                    {t.category}
                                                </span>
                                            </div>
                                            <p className="text-xs text-[#737373] line-clamp-2 mb-4 leading-relaxed">{t.desc}</p>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="border border-[#E5E5E5] rounded-lg overflow-hidden bg-white">
                                                <table className="w-full text-left text-xs">
                                                    <thead className="bg-[#FAFAFA] border-b border-[#E5E5E5]">
                                                        <tr>
                                                            <th className={thCls}>Duration</th>
                                                            <th className={cx(thCls, "text-right")}>Price (IDR)</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-[#E5E5E5]">
                                                        {t.options.map(o => (
                                                            <tr key={o.duration} className="hover:bg-[#FAFAFA] transition-colors">
                                                                <td className={cx(tdCls, "font-medium text-black")}>{o.duration} mins</td>
                                                                <td className={cx(tdCls, "font-semibold text-black text-right")}>{parseInt(o.price.replace(/,/g, '') || '0').toLocaleString('en-US')}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                            <div className="flex gap-2 pt-1 items-center">
                                                {siteBrandFilter !== 'central' && (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleTogglePin(t)}
                                                            className={`p-2 rounded-lg transition-colors shrink-0 ${
                                                                t.is_pinned ? 'bg-black text-white shadow-xs' : 'bg-white border border-[#E5E5E5] text-black hover:bg-[#F5F5F5]'
                                                            }`}
                                                            title={t.is_pinned ? "Unpin from Most Booked" : "Pin to Most Booked"}
                                                        >
                                                            <Pin size={13} className={t.is_pinned ? "fill-white" : ""} />
                                                        </button>
                                                        {t.is_pinned && t.pinned_image && (
                                                            <img src={t.pinned_image} alt="Pinned" className="w-7 h-7 object-cover rounded-lg shrink-0 border border-[#E5E5E5]" />
                                                        )}
                                                    </>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setEditingTreatmentId(t.id);
                                                        setTreatmentTitle(t.title);
                                                        setTreatmentCategory(t.category);
                                                        setTreatmentDesc(t.desc);
                                                        setBenefits(t.benefits && t.benefits.length > 0 ? t.benefits : ['']);
                                                        setPricingOptions(t.options && t.options.length > 0 ? t.options : [{ duration: '', price: '' }]);
                                                        setActiveTab('treatment');
                                                    }}
                                                    className={cx(btn.base, btn.secondary, btn.xs, "flex-1")}
                                                >
                                                    <Edit3 size={13} /> Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={async () => {
                                                        const pin = prompt('Enter admin PIN to delete:');
                                                        if (pin !== (process.env.NEXT_PUBLIC_DELETE_PIN || '022320')) {
                                                            alert('Incorrect PIN');
                                                            return;
                                                        }
                                                        if(confirm('Delete treatment?')) {
                                                            await supabase.from('treatments').delete().eq('id', t.id);
                                                            setTreatments(prev => prev.filter(x => x.id !== t.id));
                                                        }
                                                    }}
                                                    className={cx(btn.base, btn.danger, btn.xs)}
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* BOOKINGS TAB (CENTRAL ADMIN) */}
                    {activeTab === 'bookings' && siteBrandFilter === 'central' && (
                        <BookingManagement treatments={treatments} therapistFees={therapistFees} />
                    )}

                    {/* BOOKINGS TAB (THERAPICK ADMIN) */}
                    {activeTab === 'bookings' && siteBrandFilter === 'therapick' && (
                        <TherapickBookingManagement treatments={treatments} therapistFees={therapistFees} />
                    )}

                    {/* ADD-ON SETTINGS TAB (THERAPICK ADMIN ONLY) */}
                    {activeTab === 'addons' && siteBrandFilter === 'therapick' && (
                        <TherapickAddonSettings />
                    )}

                    {/* INVOICE TAB (CENTRAL ADMIN ONLY) */}
                    {activeTab === 'invoice' && siteBrandFilter === 'central' && (
                        <div className="w-full max-w-xl mx-auto mt-6 animate-in fade-in duration-300">
                            <div className="bg-white border border-[#E5E5E5] p-6 sm:p-8 rounded-xl shadow-xs text-center">
                                <div className="w-12 h-12 rounded-xl bg-[#FAFAFA] border border-[#E5E5E5] flex items-center justify-center mx-auto mb-4 text-black">
                                    <FileText size={22} />
                                </div>
                                <h2 className="text-xl font-semibold tracking-tight text-black mb-1">Create Invoice Link</h2>
                                <p className="text-xs text-[#737373] mb-6 leading-relaxed">
                                    Enter the BOOKING ID below to generate a unique invoice link. Once generated, you can copy the link and share it directly with the customer.
                                </p>
                                <div className="flex flex-col gap-3">
                                    <input 
                                        id="invoiceIdInput" 
                                        type="text" 
                                        placeholder="e.g. 9X4FA2" 
                                        className={cx(inputCls, "text-center font-bold uppercase tracking-wider py-2.5")}
                                    />
                                    <button 
                                        onClick={async () => {
                                            const val = (document.getElementById('invoiceIdInput') as HTMLInputElement).value;
                                            if(val.trim()) {
                                                const id = val.trim().toUpperCase();
                                                let domain = window.location.origin;
                                                
                                                try {
                                                    const { data, error } = await supabase.from('bookings').select('brand').eq('reference_number', id).single();
                                                    if (data && data.brand === 'bali') {
                                                        domain = 'https://www.homespaubud.com';
                                                    } else if (data && data.brand === 'therapick') {
                                                        domain = 'https://www.booktherapick.com';
                                                    } else if (data && data.brand === 'elexoir') {
                                                        domain = 'https://www.elexoirhomespaubud.com';
                                                    }
                                                } catch (e) {
                                                    console.error("Failed to detect domain", e);
                                                }

                                                const url = domain + '/invoice/' + id;
                                                const res = document.getElementById('generatedInvoiceUrl');
                                                if(res) {
                                                    res.innerText = url;
                                                    res.parentElement?.classList.remove('hidden');
                                                }
                                            }
                                        }} 
                                        className={cx(btn.base, btn.primary, btn.md, "w-full")}
                                    >
                                        Generate Invoice Link
                                    </button>
                                    
                                    <div className="hidden mt-4 p-4 bg-[#FAFAFA] rounded-xl border border-[#E5E5E5] text-left">
                                        <p className="text-[10px] font-semibold text-[#737373] uppercase tracking-wider mb-2">Generated Link</p>
                                        <p id="generatedInvoiceUrl" className="text-xs font-mono font-medium text-black break-all mb-4 bg-white p-3 rounded-lg border border-[#E5E5E5]"></p>
                                        <button 
                                            onClick={(e) => {
                                                const text = document.getElementById('generatedInvoiceUrl')?.innerText;
                                                if(text) {
                                                    navigator.clipboard.writeText(text);
                                                    const btnEl = e.currentTarget;
                                                    const oldText = btnEl.innerText;
                                                    btnEl.innerText = 'Copied!';
                                                    setTimeout(() => btnEl.innerText = oldText, 2000);
                                                }
                                            }} 
                                            className={cx(btn.base, btn.secondary, btn.sm, "w-full")}
                                        >
                                            Copy Link
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* AFFILIATE MANAGEMENT TAB (Strictly Therapick Admin Only) */}
                    {(activeTab as string) === 'affiliates' && siteBrandFilter === 'therapick' && (
                        <div className="w-full animate-in fade-in duration-300">
                            <AffiliateManagement />
                        </div>
                    )}

                </div>
            </main>

            {/* Minimalist Mobile Bottom Navigation Bar (Floating Card) */}
            <div className="md:hidden fixed bottom-6 left-4 right-4 bg-white/95 backdrop-blur-xl shadow-lg border border-[#E5E5E5] rounded-2xl z-50">
                <div className="flex items-center justify-between p-1.5 max-w-sm mx-auto">
                    {(siteBrandFilter === 'central' ? [
                        { id: 'invoice', icon: FileText, label: 'Invoice' },
                        { id: 'fees', icon: Settings, label: 'Fees' },
                        { id: 'bookings', icon: Calendar, label: 'Book' },
                        { id: 'list', icon: LayoutDashboard, label: 'Menu' },
                        { id: 'more', icon: MoreHorizontal, label: 'More' }
                    ] : siteBrandFilter === 'therapick' ? [
                        { id: 'bookings', icon: Calendar, label: 'Book' },
                        { id: 'affiliates', icon: Share2, label: 'Affils' },
                        { id: 'addons', icon: Layers, label: 'Add-ons' },
                        { id: 'treatment', icon: PlusCircle, label: 'Treats' },
                        { id: 'more', icon: MoreHorizontal, label: 'More' }
                    ] : [
                        { id: 'treatment', icon: PlusCircle, label: 'Treats' },
                        { id: 'fees', icon: Settings, label: 'Fees' },
                        { id: 'list', icon: LayoutDashboard, label: 'Menu' },
                        { id: 'more', icon: MoreHorizontal, label: 'More' }
                    ]).map((tab) => {
                        const isActive = activeTab === tab.id;
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    if (tab.id === 'more') {
                                        document.getElementById('mobile-sidebar')?.classList.remove('translate-x-full');
                                    } else {
                                        setActiveTab(tab.id as any);
                                    }
                                }}
                                className={`flex flex-col items-center justify-center flex-1 py-2 rounded-xl transition-all duration-200 ${
                                    isActive && tab.id !== 'more' ? 'bg-black text-white shadow-xs' : 'text-[#737373] hover:text-black hover:bg-[#F5F5F5]'
                                }`}
                            >
                                <Icon size={18} strokeWidth={isActive && tab.id !== 'more' ? 2.5 : 2} />
                                <span className="text-[9px] mt-1 font-semibold tracking-wider uppercase">{tab.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Hidden File Input for Pinning Images */}
            <input 
                type="file" 
                accept="image/*" 
                ref={pinImageInputRef} 
                onChange={handlePinImageUpload} 
                className="hidden" 
            />
        </div>
    );
}
