'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Megaphone, PlusCircle, Store, Settings, LayoutDashboard, 
    UploadCloud, CheckCircle, Plus, Trash2, Edit3, Pin, 
    ChevronDown, ChevronUp, Calculator, LogOut, Sparkles,
    ArrowRight, ArrowUp, ArrowDown, Compass, ShieldCheck, Check, Ticket, Search, Menu, MoreHorizontal, Calendar, FileText
} from 'lucide-react';
import Link from 'next/link';
import { useSpa, SelectedCampaignTreatment, Treatment, Product, TherapistFee, Campaign, sortCampaigns, DEFAULT_CAMPAIGNS } from '@/context/SpaContext';
import { supabase } from '@/lib/supabase';
import BookingManagement from '@/components/BookingManagement';

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

    const [activeTab, setActiveTab] = useState<'campaign' | 'treatment' | 'store' | 'fees' | 'calculator' | 'list' | 'settings' | 'promo' | 'bookings' | 'invoice'>('campaign');
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
        setSiteBrandFilter('central');
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

    // Force tab switch if central is selected
    useEffect(() => {
        if (siteBrandFilter === 'central' && (activeTab === 'campaign' || activeTab === 'promo')) {
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
                    const path = `campaigns/${targetId}/image.${ext}`;
                    
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
        <div className="min-h-screen bg-white text-black flex flex-col md:flex-row font-sans selection:bg-black selection:text-white">
            
            {/* Desktop Minimalist Black & White Sidebar */}
            <aside className="hidden md:flex flex-col w-64 bg-white border-r border-black/10 z-20 shrink-0 sticky top-0 h-screen self-start">
                <div className="p-6 border-b border-black/10 flex flex-col gap-4">
                    <div>
                        <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-black/50 block">Management</span>
                        <h1 className="text-base font-bold tracking-tight text-black">Admin Portal</h1>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-black/50 block mb-1.5">Brand Configured</label>
                        <select 
                            value={siteBrandFilter}
                            onChange={(e) => setSiteBrandFilter(e.target.value)}
                            className="w-full bg-black/5 border border-black/10 rounded-lg px-3 py-2 text-xs font-bold text-black focus:outline-none focus:border-black appearance-none cursor-pointer"
                        >
                            <option value="elexoir">Elexoir Home Spa</option>
                            <option value="bali">Home Spa Ubud</option>
                            <option value="therapick">Therapick</option>
                            <option value="central">Central Admin</option>
                        </select>
                    </div>
                </div>

                <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                    {[
                        ...(siteBrandFilter === 'central' ? [{ id: 'bookings', icon: Calendar, label: 'Booking' }, { id: 'invoice', icon: Ticket, label: 'Invoices' }] : []),
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
                                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold tracking-wide transition-all ${
                                    isActive 
                                    ? 'bg-black text-white shadow-sm' 
                                    : 'text-black/70 hover:bg-black/5 hover:text-black'
                                }`}
                            >
                                <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                                {tab.label}
                            </button>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-black/10 space-y-2">
                    <Link
                        href="/"
                        target="_blank"
                        className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold border border-black/20 hover:bg-black hover:text-white transition-colors"
                    >
                        View Live Website <ArrowRight size={14} />
                    </Link>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 relative overflow-y-auto bg-white min-h-screen pb-28 md:pb-12">
                
                {/* Sticky Mobile Admin Selector */}
                <div className="md:hidden sticky top-0 z-40 pt-4 px-4 pb-2 bg-white/95 backdrop-blur-xl border-b border-black/5 mb-2">
                    <div className="bg-white border border-black/10 rounded-2xl p-2 shadow-sm flex items-center justify-between">
                        <h2 className="text-[10px] font-bold tracking-widest uppercase text-black pl-2 truncate">Select Admin Dashboard</h2>
                        <div className="relative w-36 shrink-0">
                            <select 
                                value={siteBrandFilter}
                                onChange={(e) => setSiteBrandFilter(e.target.value)}
                                className="w-full bg-black text-white rounded-xl px-3 py-2 text-[10px] font-bold focus:outline-none appearance-none shadow-sm"
                            >
                                <option value="elexoir">Elexoir</option>
                                <option value="bali">Home Spa Ubud</option>
                                <option value="therapick">Therapick</option>
                                <option value="central">Central Admin</option>
                            </select>
                            <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
                                <ChevronDown size={12} className="text-white/50" />
                            </div>
                        </div>
                    </div>
                </div>



                {/* Mobile Sidebar (Drawer) */}
                <div id="mobile-sidebar" className="md:hidden fixed inset-0 z-[60] translate-x-full transition-transform duration-300 flex">
                    <div className="flex-1 bg-black/20 backdrop-blur-sm" onClick={() => document.getElementById('mobile-sidebar')?.classList.add('translate-x-full')}></div>
                    <div className="w-64 bg-white h-full shadow-2xl flex flex-col">
                        <div className="p-5 border-b border-black/10 flex justify-between items-center bg-black/5">
                            <span className="text-xs font-bold uppercase tracking-widest text-black">More Options</span>
                            <button onClick={() => document.getElementById('mobile-sidebar')?.classList.add('translate-x-full')} className="p-2 text-black hover:opacity-50">
                                <span className="font-bold text-xl leading-none">&times;</span>
                            </button>
                        </div>
                        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                            {[
                                ...(siteBrandFilter === 'central' ? [{ id: 'invoice', icon: Ticket, label: 'Invoices' }] : [
                                    { id: 'campaign', icon: Megaphone, label: 'Campaign Card' },
                                    { id: 'promo', icon: Ticket, label: 'Promo Codes' },
                                ]),
                                { id: 'store', icon: Store, label: 'Store Products' },
                                { id: 'calculator', icon: Calculator, label: 'Commission Calc' },
                            ].map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => {
                                            setActiveTab(tab.id as any);
                                            document.getElementById('mobile-sidebar')?.classList.add('translate-x-full');
                                        }}
                                        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-black text-white shadow-md' : 'text-black/70 bg-black/5 hover:bg-black/10'}`}
                                    >
                                        <Icon size={18} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>
                </div>

                <div className={`mx-auto p-4 md:p-8 ${
                    (activeTab === 'bookings' || activeTab === 'campaign') ? 'max-w-7xl' 
                    : (activeTab === 'list' || activeTab === 'fees' ? 'max-w-6xl' : 'max-w-4xl')
                }`}>

                                                            {/* CAMPAIGN CARD SETUP TAB */}
                    {activeTab === 'campaign' && (
                        <div className="w-full flex flex-col lg:flex-row gap-6 lg:gap-8 animate-in fade-in duration-300">
                            
                            {/* Left Sidebar: Campaigns List */}
                            <div className="w-full lg:w-1/3 flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-bold text-black tracking-tight">Campaigns</h2>
                                    <button
                                        type="button"
                                        onClick={handleNewCampaign}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black text-white text-[11px] font-bold uppercase tracking-wider hover:bg-black/80 transition-colors"
                                    >
                                        <Plus size={14} /> New
                                    </button>
                                </div>
                                
                                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex-1">
                                    {campaigns.length === 0 ? (
                                        <div className="p-8 text-center text-sm text-gray-400">
                                            No campaigns found.
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-gray-100 max-h-[calc(100vh-200px)] overflow-y-auto">
                                            {campaigns.map((camp, idx) => {
                                                const isCurrentEditing = editingCampaignId === camp.id;
                                                const isPub = camp.is_published !== false;
                                                
                                                return (
                                                    <div 
                                                        key={camp.id || idx}
                                                        className={`p-4 transition-colors cursor-pointer group ${
                                                            isCurrentEditing 
                                                            ? 'bg-blue-50/50 border-l-2 border-l-blue-600' 
                                                            : 'hover:bg-gray-50 border-l-2 border-l-transparent'
                                                        }`}
                                                        onClick={() => loadCampaignToForm(camp)}
                                                    >
                                                        <div className="flex gap-3">
                                                            <div className="w-12 h-12 rounded bg-gray-100 overflow-hidden shrink-0 border border-gray-200 relative">
                                                                {camp.image ? (
                                                                    <img src={camp.image} alt="" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                                        <Megaphone size={16} />
                                                                    </div>
                                                                )}
                                                                {!isPub && (
                                                                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center">
                                                                        <span className="text-[8px] font-bold uppercase text-black">Draft</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center justify-between mb-0.5">
                                                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider truncate">
                                                                        {camp.label || 'PROMO'}
                                                                    </span>
                                                                    <span className="text-[10px] font-bold text-gray-400">
                                                                        #{camp.order ?? (idx + 1)}
                                                                    </span>
                                                                </div>
                                                                <h4 className="text-sm font-semibold text-gray-900 truncate">
                                                                    {camp.title || 'Untitled'}
                                                                </h4>
                                                                
                                                                <div className="mt-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <div className="flex items-center gap-1">
                                                                        <button
                                                                            type="button"
                                                                            disabled={idx === 0}
                                                                            onClick={(e) => { e.stopPropagation(); handleMoveCampaign(idx, 'up'); }}
                                                                            className="p-1 rounded text-gray-400 hover:text-black hover:bg-gray-100 disabled:opacity-30"
                                                                        >
                                                                            <ArrowUp size={12} />
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            disabled={idx === campaigns.length - 1}
                                                                            onClick={(e) => { e.stopPropagation(); handleMoveCampaign(idx, 'down'); }}
                                                                            className="p-1 rounded text-gray-400 hover:text-black hover:bg-gray-100 disabled:opacity-30"
                                                                        >
                                                                            <ArrowDown size={12} />
                                                                        </button>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <button
                                                                            type="button"
                                                                            onClick={(e) => { e.stopPropagation(); handleTogglePublishCampaign(camp); }}
                                                                            className="text-[10px] font-semibold text-gray-500 hover:text-black"
                                                                        >
                                                                            {isPub ? 'Hide' : 'Publish'}
                                                                        </button>
                                                                        {camp.id && (
                                                                            <button
                                                                                type="button"
                                                                                onClick={(e) => { e.stopPropagation(); handleDeleteCampaign(camp.id!); }}
                                                                                className="text-gray-400 hover:text-red-600 p-1"
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
                                    <div className="p-3 bg-gray-50 border-t border-gray-100 flex flex-col gap-2">
                                        <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Templates</div>
                                        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1">
                                            {CAMPAIGN_PRESETS.map((preset, idx) => (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => { applyCampaignPreset(preset); scrollToCampaignForm(); }}
                                                    className="px-2 py-1 rounded text-[10px] font-semibold bg-white border border-gray-200 text-gray-700 hover:border-gray-400 whitespace-nowrap shrink-0 transition-colors"
                                                >
                                                    {preset.title}
                                                </button>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={handleRestoreDefaultCampaigns}
                                                className="px-2 py-1 rounded text-[10px] font-semibold bg-gray-200 border border-transparent text-gray-800 hover:bg-gray-300 whitespace-nowrap shrink-0 transition-colors ml-auto"
                                            >
                                                Load Defaults
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Area: Form & Preview */}
                            <div className="w-full lg:w-2/3 flex flex-col gap-6">
                                
                                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                                        <h3 className="text-base font-bold text-gray-900">
                                            {editingCampaignId ? 'Edit Campaign Details' : 'Create New Campaign'}
                                        </h3>
                                        <span className="text-xs font-semibold text-gray-500">
                                            Position #{campaignOrder || (editingCampaignId ? 1 : campaigns.length + 1)}
                                        </span>
                                    </div>

                                    <form id="campaign-form" onSubmit={handleSubmit} className="p-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                                            
                                            {/* Left Column in Form */}
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">Headline</label>
                                                    <input 
                                                        type="text" required placeholder="e.g. Summer Package" 
                                                        value={campaignTitle} onChange={e => setCampaignTitle(e.target.value)}
                                                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-colors"
                                                    />
                                                </div>
                                                
                                                <div>
                                                    <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">Badge Label</label>
                                                    <input 
                                                        type="text" required placeholder="e.g. 10% OFF" 
                                                        value={campaignLabel} onChange={e => setCampaignLabel(e.target.value)}
                                                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-colors"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">Description</label>
                                                    <textarea 
                                                        rows={2} placeholder="Brief details about the promo..." 
                                                        value={campaignDesc} onChange={e => setCampaignDesc(e.target.value)}
                                                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-colors resize-none"
                                                    />
                                                </div>

                                                <div className="flex gap-4">
                                                    <div className="flex-1">
                                                        <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">Discount %</label>
                                                        <input 
                                                            type="number" required min="0" max="100" 
                                                            value={discountPercentage} onChange={e => setDiscountPercentage(Math.max(0, Math.min(100, Number(e.target.value))))}
                                                            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-colors"
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">Image URL</label>
                                                        <div className="flex relative">
                                                            <input 
                                                                type="text" placeholder="https://..." 
                                                                value={campaignImage} onChange={e => setCampaignImage(e.target.value)}
                                                                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-colors pr-8"
                                                            />
                                                            <label className="absolute right-2 top-2 cursor-pointer text-gray-400 hover:text-black">
                                                                <UploadCloud size={16} />
                                                                <input type="file" accept="image/*" className="hidden" onChange={handleCampaignImageUpload} />
                                                            </label>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right Column in Form: Preview & Treatments */}
                                            <div className="space-y-5">
                                                {/* Mini Preview */}
                                                <div>
                                                    <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">Card Preview</label>
                                                    <div className="relative w-full aspect-[2/1] rounded-xl overflow-hidden border border-gray-200 bg-gray-900">
                                                        {campaignImage ? (
                                                            <img src={campaignImage} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-70" />
                                                        ) : (
                                                            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                                                                <span className="text-gray-400 text-xs">No image</span>
                                                            </div>
                                                        )}
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-4">
                                                            <span className="inline-block px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-[8px] font-bold tracking-wider uppercase text-white mb-1.5 w-fit">
                                                                {campaignLabel || 'PROMO'}
                                                            </span>
                                                            <h3 className="text-lg font-bold text-white leading-tight">{campaignTitle || 'Title'}</h3>
                                                            {campaignDesc && <p className="text-[10px] text-white/80 mt-1 line-clamp-1">{campaignDesc}</p>}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider">Eligible Treatments</label>
                                                        <div className="flex gap-2">
                                                            <button type="button" onClick={selectAllTreatments} className="text-[10px] font-semibold text-blue-600 hover:underline">Select All</button>
                                                            <button type="button" onClick={clearAllCampaignTreatments} className="text-[10px] font-semibold text-gray-500 hover:underline">Clear</button>
                                                        </div>
                                                    </div>
                                                    <div className="h-40 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-1.5 bg-gray-50/30">
                                                        {treatments.map((t) => {
                                                            const selectedT = campaignTreatments.find(ct => ct.treatmentId === t.id);
                                                            return (
                                                                <div key={t.id} className="bg-white border border-gray-200 p-2 rounded text-xs">
                                                                    <div className="font-semibold text-gray-800 mb-1.5">{t.title}</div>
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {t.options.map(opt => {
                                                                            const isSelected = selectedT?.durations.includes(opt.duration);
                                                                            return (
                                                                                <button
                                                                                    type="button"
                                                                                    key={opt.duration}
                                                                                    onClick={() => toggleCampaignTreatmentDuration(t.id, opt.duration)}
                                                                                    className={`px-2 py-0.5 rounded border text-[10px] font-medium transition-colors ${
                                                                                        isSelected ? 'bg-black border-black text-white' : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-400'
                                                                                    }`}
                                                                                >
                                                                                    {opt.duration}m
                                                                                </button>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-8 pt-5 border-t border-gray-100 flex items-center justify-between">
                                            {success ? (
                                                <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                                                    <CheckCircle size={14} /> Saved successfully
                                                </span>
                                            ) : <div/>}
                                            
                                            <div className="flex gap-3">
                                                {editingCampaignId && (
                                                    <button
                                                        type="button"
                                                        onClick={handleNewCampaign}
                                                        className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-50 transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                )}
                                                <button
                                                    type="submit"
                                                    disabled={isSubmitting}
                                                    className="px-6 py-2 rounded-lg bg-black text-white text-xs font-bold shadow-sm hover:bg-black/90 transition-colors disabled:opacity-50"
                                                >
                                                    {isSubmitting ? 'Saving...' : (editingCampaignId ? 'Save Changes' : 'Publish Campaign')}
                                                </button>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TREATMENT CREATION TAB */}
                    {/* PROMO CODES TAB */}
                    {activeTab === 'promo' && (
                        <div className="space-y-6">
                            <form onSubmit={handlePromoSubmit} className="bg-white border border-black/15 rounded-2xl p-5 md:p-8 shadow-sm">
                                <h3 className="text-base font-bold uppercase tracking-wider text-black mb-6">Create Promo Code</h3>
                                
                                {success && (
                                    <div className="mb-6 p-4 bg-[#F6F3EC] border border-[#E5E0D8] rounded-xl flex items-start gap-3">
                                        <CheckCircle className="w-5 h-5 text-black shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="text-sm font-bold text-black uppercase tracking-wider mb-1">Success</h4>
                                            <p className="text-xs text-black/70">Promo code created successfully.</p>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-black/70 ml-1">Promo Code</label>
                                        <input 
                                            type="text" required placeholder="e.g. SUMMER20"
                                            value={promoForm.code} onChange={e => setPromoForm({...promoForm, code: e.target.value.toUpperCase()})}
                                            className="w-full bg-[#FDFBF7] border border-black/10 rounded-xl px-4 py-3.5 text-sm text-black placeholder:text-black/30 focus:outline-none focus:ring-1 focus:ring-black transition-all uppercase"
                                        />
                                    </div>
                                    
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-black/70 ml-1">Discount Type</label>
                                        <select 
                                            value={promoForm.discount_type} onChange={e => setPromoForm({...promoForm, discount_type: e.target.value})}
                                            className="w-full bg-[#FDFBF7] border border-black/10 rounded-xl px-4 py-3.5 text-sm text-black focus:outline-none focus:ring-1 focus:ring-black transition-all appearance-none"
                                        >
                                            <option value="percentage">Percentage (%)</option>
                                            <option value="fixed">Fixed Amount (IDR)</option>
                                        </select>
                                    </div>
                                    
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-black/70 ml-1">Discount Value</label>
                                        <input 
                                            type="number" required min="0" placeholder="e.g. 20"
                                            value={promoForm.discount_value || ''} onChange={e => setPromoForm({...promoForm, discount_value: parseFloat(e.target.value) || 0})}
                                            className="w-full bg-[#FDFBF7] border border-black/10 rounded-xl px-4 py-3.5 text-sm text-black placeholder:text-black/30 focus:outline-none focus:ring-1 focus:ring-black transition-all"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-black/70 ml-1">Max Uses (0 = unlimited)</label>
                                        <input 
                                            type="number" required min="0" placeholder="e.g. 100"
                                            value={promoForm.max_uses || ''} onChange={e => setPromoForm({...promoForm, max_uses: parseInt(e.target.value) || 0})}
                                            className="w-full bg-[#FDFBF7] border border-black/10 rounded-xl px-4 py-3.5 text-sm text-black placeholder:text-black/30 focus:outline-none focus:ring-1 focus:ring-black transition-all"
                                        />
                                    </div>
                                </div>
                                
                                <div className="mt-6 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={isPromoFormLoading}
                                        className="bg-black text-white px-8 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-black/80 transition-all shadow-sm disabled:opacity-50"
                                    >
                                        {isPromoFormLoading ? 'Saving...' : 'Create Promo Code'}
                                    </button>
                                </div>
                            </form>

                            <div className="bg-white border border-black/15 rounded-2xl overflow-hidden shadow-sm">
                                <div className="p-5 md:p-6 border-b border-black/10">
                                    <h3 className="text-base font-bold uppercase tracking-wider text-black">Active Promo Codes</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-[#FDFBF7] border-b border-black/10">
                                            <tr>
                                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-black/50">Code</th>
                                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-black/50">Discount</th>
                                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-black/50">Uses</th>
                                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-black/50">Status</th>
                                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-black/50 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {promoCodes.map(promo => (
                                                <tr key={promo.id} className="border-b border-black/5 hover:bg-black/[0.02]">
                                                    <td className="px-6 py-4 font-bold text-black">{promo.code}</td>
                                                    <td className="px-6 py-4">
                                                        {promo.discount_type === 'percentage' ? `${promo.discount_value}%` : `IDR ${promo.discount_value.toLocaleString()}`}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {promo.current_uses} / {promo.max_uses === 0 ? '∞' : promo.max_uses}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <button 
                                                            onClick={() => togglePromo(promo.id, promo.is_active)}
                                                            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${promo.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                                                        >
                                                            {promo.is_active ? 'Active' : 'Inactive'}
                                                        </button>
                                                    </td>
                                                    <td className="px-6 py-4 text-right space-x-2">
                                                        <button onClick={() => deletePromo(promo.id)} className="p-2 text-black/40 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {promoCodes.length === 0 && (
                                                <tr>
                                                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-black/50 italic">
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
                        <form id="treatment-form" onSubmit={handleSubmit} className="space-y-6 bg-white border border-black/15 rounded-2xl p-5 md:p-8 shadow-sm">
                            <div className="flex items-center justify-between border-b border-black/10 pb-4">
                                <h3 className="text-base font-bold uppercase tracking-wider text-black">
                                    {editingTreatmentId ? 'Edit Treatment' : 'Add New Spa Treatment'}
                                </h3>
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
                                        className="text-xs text-black/60 hover:text-black underline font-bold"
                                    >
                                        Cancel Edit
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-black/70">Treatment Title</label>
                                    <input 
                                        type="text" required placeholder="e.g. Traditional Balinese Massage" 
                                        value={treatmentTitle} onChange={e => setTreatmentTitle(e.target.value)}
                                        className="w-full bg-white border border-black/20 rounded-xl px-4 py-3 text-sm text-black placeholder:text-black/40 focus:outline-none focus:border-black"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-black/70">Category</label>
                                    <select 
                                        value={treatmentCategory} onChange={e => setTreatmentCategory(e.target.value)}
                                        className="w-full bg-white border border-black/20 rounded-xl px-4 py-3 text-sm text-black focus:outline-none focus:border-black"
                                    >
                                        <option value="massage">Massage</option>
                                        <option value="facial">Facial</option>
                                        <option value="package">Package</option>
                                        <option value="ritual">Ritual</option>
                                    </select>
                                </div>
                            </div>

                            {/* Duration & Pricing */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold uppercase tracking-wider text-black/70">Duration & Pricing</label>
                                    <button type="button" onClick={handleAddPricing} className="text-xs font-bold text-black flex items-center gap-1 hover:opacity-70">
                                        <Plus size={14} /> Add Option
                                    </button>
                                </div>
                                {pricingOptions.map((option, idx) => (
                                    <div key={idx} className="flex items-center gap-3">
                                        <div className="w-32 relative">
                                            <input 
                                                type="number" required placeholder="60" value={option.duration} onChange={(e) => handlePricingChange(idx, 'duration', e.target.value)}
                                                className="w-full bg-white border border-black/20 rounded-xl px-3 py-2.5 text-sm text-black focus:outline-none focus:border-black"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-black/50">MINS</span>
                                        </div>
                                        <div className="flex-1 relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-black/50">Rp</span>
                                            <input 
                                                type="text" required placeholder="450,000" value={option.price} onChange={(e) => handlePricingChange(idx, 'price', e.target.value)}
                                                className="w-full bg-white border border-black/20 rounded-xl pl-9 pr-4 py-2.5 text-sm text-black focus:outline-none focus:border-black"
                                            />
                                        </div>
                                        {pricingOptions.length > 1 && (
                                            <button type="button" onClick={() => handleRemovePricing(idx)} className="p-2.5 rounded-xl bg-black/5 text-black hover:bg-black/10">
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-black/70">Description</label>
                                <textarea 
                                    required rows={3} placeholder="Write details about the treatment..." 
                                    value={treatmentDesc} onChange={e => setTreatmentDesc(e.target.value)}
                                    className="w-full bg-white border border-black/20 rounded-xl px-4 py-3 text-sm text-black placeholder:text-black/40 focus:outline-none focus:border-black resize-none"
                                />
                            </div>

                            {/* Benefits */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold uppercase tracking-wider text-black/70">Key Benefits</label>
                                    <button type="button" onClick={handleAddBenefit} className="text-xs font-bold text-black flex items-center gap-1 hover:opacity-70">
                                        <Plus size={14} /> Add Benefit
                                    </button>
                                </div>
                                {benefits.map((b, idx) => (
                                    <div key={idx} className="flex items-center gap-3">
                                        <input 
                                            type="text" required placeholder="e.g. Deep relaxation & stress relief" value={b} onChange={(e) => handleBenefitChange(idx, e.target.value)}
                                            className="w-full bg-white border border-black/20 rounded-xl px-4 py-2.5 text-sm text-black focus:outline-none focus:border-black"
                                        />
                                        {benefits.length > 1 && (
                                            <button type="button" onClick={() => handleRemoveBenefit(idx)} className="p-2.5 rounded-xl bg-black/5 text-black hover:bg-black/10">
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="pt-4 border-t border-black/10 flex justify-end">
                                <button type="submit" disabled={isSubmitting} className="bg-black text-white px-8 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-black/80">
                                    {isSubmitting ? 'Saving...' : editingTreatmentId ? 'Update Treatment' : 'Create Treatment'}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* STORE PRODUCTS TAB */}
                    {activeTab === 'store' && (
                        <form onSubmit={handleSubmit} className="space-y-6 bg-white border border-black/15 rounded-2xl p-5 md:p-8 shadow-sm">
                            <h3 className="text-base font-bold uppercase tracking-wider text-black border-b border-black/10 pb-4">
                                {editingProductId ? 'Edit Product' : 'Add Store Product'}
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-black/70">Product Title</label>
                                    <input 
                                        type="text" required placeholder="e.g. Organic Coconut Massage Oil" 
                                        value={productTitle} onChange={e => setProductTitle(e.target.value)}
                                        className="w-full bg-white border border-black/20 rounded-xl px-4 py-3 text-sm text-black placeholder:text-black/40 focus:outline-none focus:border-black"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-black/70">Price (IDR)</label>
                                    <input 
                                        type="text" required placeholder="185,000" 
                                        value={productPrice} onChange={e => setProductPrice(e.target.value)}
                                        className="w-full bg-white border border-black/20 rounded-xl px-4 py-3 text-sm text-black placeholder:text-black/40 focus:outline-none focus:border-black"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-black/70">Product Description</label>
                                <textarea 
                                    required rows={3} placeholder="Product details and benefits..." 
                                    value={productDesc} onChange={e => setProductDesc(e.target.value)}
                                    className="w-full bg-white border border-black/20 rounded-xl px-4 py-3 text-sm text-black placeholder:text-black/40 focus:outline-none focus:border-black resize-none"
                                />
                            </div>

                            <div className="pt-4 border-t border-black/10 flex justify-end">
                                <button type="submit" disabled={isSubmitting} className="bg-black text-white px-8 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-black/80">
                                    {isSubmitting ? 'Saving...' : editingProductId ? 'Update Product' : 'Add Product'}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* THERAPIST FEES TAB */}
                    {activeTab === 'fees' && (
                        <div className="space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-4">
                                <div>
                                    <h3 className="text-lg font-bold uppercase tracking-widest text-black">Therapist Fee Setup</h3>
                                    <p className="text-xs text-black/60">Set wage payouts per treatment duration.</p>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                                    <div className="relative w-full sm:w-64">
                                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                            <Search className="h-4 w-4 text-black/40" />
                                        </div>
                                        <input 
                                            type="text" 
                                            placeholder="Search treatments..." 
                                            value={feeSearch} 
                                            onChange={e => setFeeSearch(e.target.value)}
                                            className="w-full pl-9 pr-4 py-2 bg-white border border-black/15 rounded-xl text-sm focus:outline-none focus:border-black"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {treatments.filter(t => t.title.toLowerCase().includes(feeSearch.toLowerCase())).map(t => (
                                    <div key={t.id} className="bg-white border border-black/15 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-start mb-4">
                                                <h4 className="font-bold text-black text-base pr-4">{t.title}</h4>
                                                <span className="text-[9px] uppercase tracking-widest font-bold bg-black/5 px-2 py-1 rounded-md text-black/60 shrink-0">{t.category}</span>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="border border-black/10 rounded-xl overflow-hidden">
                                                <table className="w-full text-left text-xs">
                                                    <thead className="bg-black/[0.03]">
                                                        <tr>
                                                            <th className="px-3 py-2 font-bold text-black/50 uppercase tracking-widest text-[9px]">Duration</th>
                                                            <th className="px-3 py-2 font-bold text-black/50 uppercase tracking-widest text-[9px] text-right">Fee (IDR)</th>
                                                            <th className="px-3 py-2"></th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-black/5">
                                                        {t.options.map(opt => {
                                                            const isEditing = editingFee?.id === t.id && editingFee?.duration === opt.duration;
                                                            const feeObj = therapistFees.find(f => f.treatment_id === t.id && f.duration === opt.duration);
                                                            const feeValue = feeObj ? parseInt(feeObj.fee.replace(/,/g, '') || '0').toLocaleString('en-US') : '-';
                                                            
                                                            return (
                                                                <tr key={opt.duration} className="bg-white">
                                                                    <td className="px-3 py-2.5 font-bold text-black">{opt.duration} mins</td>
                                                                    <td className="px-3 py-2.5 font-bold text-black text-right">
                                                                        {isEditing ? (
                                                                            <input 
                                                                                type="text"
                                                                                autoFocus
                                                                                placeholder="e.g. 150,000"
                                                                                value={feeInputs[`${t.id}-${opt.duration}`] || ''}
                                                                                onChange={e => setFeeInputs({ ...feeInputs, [`${t.id}-${opt.duration}`]: e.target.value })}
                                                                                className="w-24 bg-white border border-black/20 rounded-lg px-2 py-1 text-xs text-right text-black focus:outline-none focus:border-black"
                                                                            />
                                                                        ) : (
                                                                            feeValue
                                                                        )}
                                                                    </td>
                                                                    <td className="px-3 py-2.5 text-right flex items-center justify-end gap-2">
                                                                        {isEditing ? (
                                                                            <>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => handleSaveFee(t.id, opt.duration)}
                                                                                    className="px-2 py-1 rounded-lg bg-black text-white text-[10px] font-bold uppercase hover:bg-black/80"
                                                                                >
                                                                                    Save
                                                                                </button>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => setEditingFee(null)}
                                                                                    className="text-black/40 hover:text-black font-bold text-[10px] uppercase"
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
                                                                                    className="p-1 text-black/40 hover:text-black transition-colors"
                                                                                >
                                                                                    {feeObj ? <Edit3 size={14} /> : <span className="px-2 py-0.5 text-[9px] border border-black/20 rounded uppercase font-bold text-black/60 hover:border-black hover:text-black">Add Fee</span>}
                                                                                </button>
                                                                                {feeObj && (
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => handleDeleteFee(t.id, opt.duration)}
                                                                                        className="p-1 text-red-400 hover:text-red-600 transition-colors"
                                                                                    >
                                                                                        <Trash2 size={14} />
                                                                                    </button>
                                                                                )}
                                                                            </>
                                                                        )}
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
                    {activeTab === 'calculator' && (
                        <div className="space-y-6 bg-white border border-black/15 rounded-2xl p-5 md:p-8 shadow-sm">
                            <h3 className="text-base font-bold uppercase tracking-wider text-black border-b border-black/10 pb-4">
                                Commission & Net Profit Calculator
                            </h3>
                            
                            <div className="flex items-center justify-between">
                                <p className="text-xs text-black/60">Add items to calculate instant wage and commission split.</p>
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
                                    className="px-4 py-2 bg-black text-white text-xs font-bold rounded-xl flex items-center gap-1 hover:bg-black/80"
                                >
                                    <Plus size={14} /> Add Row
                                </button>
                            </div>

                            {calculations.map((calc, idx) => {
                                const tr = treatments.find(t => t.id === calc.treatmentId);
                                const opt = tr?.options.find(o => o.duration === calc.duration);
                                const priceNum = opt ? parseInt(opt.price.replace(/,/g, '')) : 0;
                                const feeStr = feeInputs[`${calc.treatmentId}-${calc.duration}`] || '0';
                                const feeNum = parseInt(feeStr.replace(/,/g, '')) || 0;
                                const isCouple = tr?.title?.toLowerCase().includes('couple');
                                const multiplier = isCouple ? 2 : 1;
                                const totalRevenue = priceNum * calc.treatmentsCount;
                                const totalWage = feeNum * calc.treatmentsCount * multiplier;
                                const netMargin = totalRevenue - totalWage;

                                return (
                                    <div key={calc.id} className="p-4 rounded-xl border border-black/10 bg-black/[0.02] flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex flex-wrap items-center gap-3">
                                            <select
                                                value={calc.treatmentId}
                                                onChange={e => {
                                                    const newTId = e.target.value;
                                                    const newT = treatments.find(t => t.id === newTId);
                                                    setCalculations(prev => prev.map(c => c.id === calc.id ? { ...c, treatmentId: newTId, duration: newT?.options[0]?.duration || '60' } : c));
                                                }}
                                                className="bg-white border border-black/20 rounded-lg px-3 py-2 text-xs text-black"
                                            >
                                                {treatments.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                                            </select>

                                            <select
                                                value={calc.duration}
                                                onChange={e => setCalculations(prev => prev.map(c => c.id === calc.id ? { ...c, duration: e.target.value } : c))}
                                                className="bg-white border border-black/20 rounded-lg px-3 py-2 text-xs text-black"
                                            >
                                                {tr?.options.map(o => <option key={o.duration} value={o.duration}>{o.duration} Mins</option>)}
                                            </select>

                                            <div className="flex items-center gap-1 text-xs">
                                                <span>Qty:</span>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={calc.treatmentsCount}
                                                    onChange={e => setCalculations(prev => prev.map(c => c.id === calc.id ? { ...c, treatmentsCount: Number(e.target.value) } : c))}
                                                    className="w-14 bg-white border border-black/20 rounded-lg px-2 py-1.5 text-xs text-black text-center"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between md:justify-end gap-4">
                                            <div className="text-right">
                                                <div className="text-xs font-bold text-black">Rev: Rp {totalRevenue.toLocaleString()}</div>
                                                <div className="text-[10px] text-black/60">Wage: Rp {totalWage.toLocaleString()} | Net: <strong className="text-black">Rp {netMargin.toLocaleString()}</strong></div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => setCalculations(prev => prev.filter(c => c.id !== calc.id))}
                                                className="p-2 text-black/40 hover:text-black"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* OVERVIEW TAB */}
                    {activeTab === 'list' && (
                        <div className="space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-4">
                                <h3 className="text-lg font-bold uppercase tracking-widest text-black">
                                    Treatment Catalog
                                </h3>
                                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                                    <button 
                                        onClick={() => {
                                            setEditingTreatmentId(null);
                                            setTreatmentTitle('');
                                            setTreatmentDesc('');
                                            setBenefits(['']);
                                            setPricingOptions([{ duration: '', price: '' }]);
                                            setActiveTab('treatment');
                                        }}
                                        className="bg-black text-white px-4 py-2 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 whitespace-nowrap"
                                    >
                                        <PlusCircle size={16} /> Create Treatment
                                    </button>
                                    <div className="relative w-full sm:w-64">
                                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                            <Search className="h-4 w-4 text-black/40" />
                                        </div>
                                        <input 
                                            type="text" 
                                            placeholder="Search treatments..." 
                                            value={menuSearch}
                                            onChange={(e) => setMenuSearch(e.target.value)}
                                            className="w-full pl-9 pr-4 py-2 bg-white border border-black/15 rounded-xl text-sm focus:outline-none focus:border-black"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {treatments.filter(t => t.title.toLowerCase().includes(menuSearch.toLowerCase()) || t.category.toLowerCase().includes(menuSearch.toLowerCase())).map(t => (
                                    <div key={t.id} className="bg-white border border-black/15 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-bold text-black text-base pr-4">{t.title}</h4>
                                                <span className="text-[9px] uppercase tracking-widest font-bold bg-black/5 px-2 py-1 rounded-md text-black/60 shrink-0">{t.category}</span>
                                            </div>
                                            <p className="text-xs text-black/60 line-clamp-2 mb-4 leading-relaxed">{t.desc}</p>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="border border-black/10 rounded-xl overflow-hidden">
                                                <table className="w-full text-left text-xs">
                                                    <thead className="bg-black/[0.03]">
                                                        <tr>
                                                            <th className="px-3 py-2 font-bold text-black/50 uppercase tracking-widest text-[9px]">Duration</th>
                                                            <th className="px-3 py-2 font-bold text-black/50 uppercase tracking-widest text-[9px] text-right">Price (IDR)</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-black/5">
                                                        {t.options.map(o => (
                                                            <tr key={o.duration} className="bg-white">
                                                                <td className="px-3 py-2.5 font-bold text-black">{o.duration} mins</td>
                                                                <td className="px-3 py-2.5 font-bold text-black text-right">{parseInt(o.price.replace(/,/g, '') || '0').toLocaleString('en-US')}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                            <div className="flex gap-2 pt-2 items-center">
                                                {siteBrandFilter !== 'central' && (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleTogglePin(t)}
                                                            className={`p-2 rounded-xl transition-colors shrink-0 ${
                                                                t.is_pinned ? 'bg-black text-white shadow-sm' : 'bg-black/5 text-black hover:bg-black/10'
                                                            }`}
                                                            title={t.is_pinned ? "Unpin from Most Booked" : "Pin to Most Booked"}
                                                        >
                                                            <Pin size={14} className={t.is_pinned ? "fill-white" : ""} />
                                                        </button>
                                                        {t.is_pinned && t.pinned_image && (
                                                            <img src={t.pinned_image} alt="Pinned" className="w-7 h-7 object-cover rounded-lg shrink-0 border border-black/10" />
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
                                                    className="flex-1 bg-black/5 text-black text-xs font-bold py-2 rounded-xl hover:bg-black/10 transition-colors flex items-center justify-center gap-1"
                                                >
                                                    <Edit3 size={14} /> Edit
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
                                                    className="px-3 bg-red-500/10 text-red-600 text-xs font-bold rounded-xl hover:bg-red-500/20 transition-colors"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* BOOKINGS TAB (CENTRAL ADMIN ONLY) */}
                    {activeTab === 'bookings' && siteBrandFilter === 'central' && (
                        <BookingManagement treatments={treatments} therapistFees={therapistFees} />
                    )}

                    {/* INVOICE TAB (CENTRAL ADMIN ONLY) */}
                    {activeTab === 'invoice' && siteBrandFilter === 'central' && (
                        <div className="w-full max-w-xl mx-auto mt-10 animate-in fade-in duration-300">
                            <div className="bg-white border border-black/10 p-8 rounded-2xl shadow-sm text-center">
                                <FileText size={48} className="mx-auto text-black/20 mb-4" />
                                <h2 className="text-xl font-bold tracking-tight text-black mb-2">Create Invoice Link</h2>
                                <p className="text-xs text-black/50 mb-6 font-medium">
                                    Enter the BOOKING ID below to generate a unique invoice link. Once generated, you can copy the link and share it directly with the customer.
                                </p>
                                <div className="flex flex-col gap-3">
                                    <input 
                                        id="invoiceIdInput" 
                                        type="text" 
                                        placeholder="e.g. 9X4FA2" 
                                        className="w-full border border-black/20 focus:border-black p-3 rounded-xl outline-none text-sm font-bold text-center transition-colors uppercase" 
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
                                        className="w-full bg-black text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-black/80 transition-colors"
                                    >
                                        Generate Invoice Link
                                    </button>
                                    
                                    <div className="hidden mt-4 p-4 bg-black/5 rounded-xl border border-black/10 text-left">
                                        <p className="text-[10px] font-bold text-black/50 uppercase tracking-wider mb-2">Generated Link</p>
                                        <p id="generatedInvoiceUrl" className="text-sm font-medium text-black break-all mb-4 bg-white p-3 rounded-lg border border-black/10"></p>
                                        <button 
                                            onClick={(e) => {
                                                const text = document.getElementById('generatedInvoiceUrl')?.innerText;
                                                if(text) {
                                                    navigator.clipboard.writeText(text);
                                                    const btn = e.currentTarget;
                                                    const oldText = btn.innerText;
                                                    btn.innerText = 'Copied!';
                                                    setTimeout(() => btn.innerText = oldText, 2000);
                                                }
                                            }}
                                            className="w-full bg-white border border-black/20 text-black px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-black/5 transition-colors"
                                        >
                                            Copy Link
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </main>

            {/* Minimalist Mobile Bottom Navigation Bar (Floating Card) */}
            <div className="md:hidden fixed bottom-6 left-4 right-4 bg-white/95 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-black/10 rounded-2xl z-50">
                <div className="flex items-center justify-between p-1.5 max-w-sm mx-auto">
                    {(siteBrandFilter === 'central' ? [
                        { id: 'invoice', icon: FileText, label: 'Invoice' },
                        { id: 'fees', icon: Settings, label: 'Fees' },
                        { id: 'bookings', icon: Calendar, label: 'Book' },
                        { id: 'list', icon: LayoutDashboard, label: 'Menu' },
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
                                className={`flex flex-col items-center justify-center flex-1 py-2.5 rounded-xl transition-all duration-300 ${
                                    isActive && tab.id !== 'more' ? 'bg-black text-white shadow-md scale-95' : 'text-black/50 hover:bg-black/5 hover:text-black'
                                }`}
                            >
                                <Icon size={20} strokeWidth={isActive && tab.id !== 'more' ? 2.5 : 2} />
                                <span className="text-[9px] mt-1 font-bold tracking-widest uppercase">{tab.label}</span>
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
