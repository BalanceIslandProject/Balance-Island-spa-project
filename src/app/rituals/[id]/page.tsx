'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Share, MapPin, Clock, Calendar, Sparkles, Plus, Minus, X, MessageCircle, Heart, Bitcoin, ArrowRight, User, Tag, DoorOpen, Trash2, Info } from 'lucide-react';
import Link from 'next/link';
import { saveBookingToSupabase } from '@/lib/bookingUtils';
import { useCart } from '@/context/CartContext';
import { calculateCartTotal, getItemMultiplier } from '@/lib/pricingUtils';
import { useParams } from 'next/navigation';
import { useSpa, Treatment } from '@/context/SpaContext';
import { supabase } from '@/lib/supabase';
import { createSlug } from '@/utils/slugify';
import { SPA_ADDONS } from '@/lib/constants';

export default function RitualsDetails() {
    const { saveDraft, confirmBooking } = useCart();
    const bookingIdRef = React.useRef<string>(Math.random().toString(36).substring(2, 8).toUpperCase());

    const params = useParams();
    const id = params?.id as string;
    const { treatments, siteBrandFilter } = useSpa();
    const contextTreatment = treatments.find(t => t.id === id || createSlug(t.title) === id);
    const [fetchedTreatment, setFetchedTreatment] = useState<Treatment | null>(null);
    const [fetchFailed, setFetchFailed] = useState(false);

    // Direct Supabase fallback if treatment is not yet in context or arrived via direct URL/slug
    useEffect(() => {
        if (contextTreatment || fetchedTreatment || fetchFailed) return;
        let isMounted = true;
        async function fetchSingleTreatment() {
            try {
                const { data } = await supabase
                    .from('treatments')
                    .select('*')
                    .eq('is_published', true);
                if (data && data.length > 0) {
                    const found = data.find(
                        (t: any) => t.id === id || createSlug(t.title) === id
                    );
                    if (isMounted) {
                        if (found) {
                            setFetchedTreatment(found);
                        } else {
                            setFetchFailed(true);
                        }
                    }
                } else if (isMounted) {
                    setFetchFailed(true);
                }
            } catch (err) {
                if (isMounted) setFetchFailed(true);
            }
        }
        fetchSingleTreatment();
        return () => { isMounted = false; };
    }, [id, contextTreatment, fetchedTreatment, fetchFailed]);

    const treatment = contextTreatment || fetchedTreatment;

    const [selectedOptionIdx, setSelectedOptionIdx] = useState(0);
    const [cartItems, setCartItems] = useState<{
        id: string;
        treatmentId: string;
        title: string;
        duration: string;
        price: number;
        guests: number;
        massageTable?: boolean;
        addons?: any[];
    }[]>([]);
    const [isSelectingMore, setIsSelectingMore] = useState(false);
    const [expandedTreatmentId, setExpandedTreatmentId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isReviewingBooking, setIsReviewingBooking] = useState(false);
    const [detailsModalTreatment, setDetailsModalTreatment] = useState<any>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [openAddonItemId, setOpenAddonItemId] = useState<string | null>(null);
    const [massageTableCount, setMassageTableCount] = useState<number>(0);
    const [showTableFeeInfo, setShowTableFeeInfo] = useState<boolean>(false);
    const [availableAddons, setAvailableAddons] = useState<any[]>([]);
    const [therapickStep, setTherapickStep] = useState<'selection' | 'details' | 'review'>('selection');

    // Load custom addons configured from Therapick Admin Dashboard
    useEffect(() => {
        const loadCustomAddons = () => {
            try {
                const raw = localStorage.getItem('therapick_custom_addons');
                if (raw) {
                    const parsed = JSON.parse(raw);
                    if (Array.isArray(parsed)) {
                        setAvailableAddons(parsed.filter((a: any) => a.is_active));
                        return;
                    }
                }
            } catch (e) {
                console.error('Failed to load custom addons', e);
            }
            setAvailableAddons([]);
        };
        loadCustomAddons();
        window.addEventListener('storage', loadCustomAddons);
        window.addEventListener('therapick_addons_updated', loadCustomAddons);
        return () => {
            window.removeEventListener('storage', loadCustomAddons);
            window.removeEventListener('therapick_addons_updated', loadCustomAddons);
        };
    }, []);
    
    // Promo Code State
    const [promoCodeInput, setPromoCodeInput] = useState('');
    const [appliedPromo, setAppliedPromo] = useState<any>(null);
    const [isPromoLoading, setIsPromoLoading] = useState(false);
    const [promoError, setPromoError] = useState('');
    const [promoSuccess, setPromoSuccess] = useState('');
    
    // Initialize date and time
    const getInitialDateTime = () => {
        const now = new Date();
        const date = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
        const time = now.toTimeString().split(' ')[0].substring(0, 5);
        return { date, time };
    };
    
    const [formData, setFormData] = useState({ name: '', location: '', room: '', whatsapp: '', ...getInitialDateTime() });
    const isTherapick = siteBrandFilter === 'therapick' || (typeof window !== 'undefined' && (window.location.hostname.includes('therapick') || window.location.hostname.includes('booktherapick')));

    if (!treatment) {
        if (fetchFailed) {
            return (
                <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center pt-24 pb-16">
                    <div className="max-w-md w-full bg-white/70 backdrop-blur-xl border border-black/5 rounded-[32px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                        <span className="text-[10px] font-bold tracking-widest uppercase text-primary/60 mb-2 block">
                            Treatment Not Found
                        </span>
                        <h2 className="font-serif text-2xl md:text-3xl text-primary mb-3">
                            Looking for Relaxation?
                        </h2>
                        <p className="text-xs md:text-sm text-text-muted font-light mb-6 leading-relaxed">
                            This ritual may have been updated or moved. Discover our complete menu of 5-star mobile spa treatments.
                        </p>
                        <Link
                            href="/explore"
                            className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-full bg-primary text-white text-xs font-bold uppercase tracking-widest hover:bg-black transition-all active:scale-95 shadow-sm"
                        >
                            Explore All Treatments
                        </Link>
                    </div>
                </div>
            );
        }

        // Luxury Skeleton UI — absolutely NO "Loading..." text!
        return (
            <div className="min-h-screen bg-background pt-24 md:pt-36 pb-20 px-6 max-w-7xl mx-auto animate-pulse">
                {/* Back / Action skeleton */}
                <div className="flex items-center justify-between mb-8 max-w-3xl mx-auto">
                    <div className="w-12 h-12 rounded-full bg-black/5" />
                    <div className="w-12 h-12 rounded-full bg-black/5" />
                </div>
                {/* Category & Title skeleton */}
                <div className="mb-8 max-w-3xl mx-auto">
                    <div className="w-24 h-6 rounded-full bg-black/5 mb-4" />
                    <div className="w-3/4 max-w-md h-10 md:h-14 rounded-2xl bg-black/5 mb-3" />
                    <div className="w-1/2 max-w-xs h-6 rounded-xl bg-black/5" />
                </div>
                {/* Bento Grid skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10 max-w-3xl mx-auto">
                    <div className="bg-white/40 border border-black/5 rounded-[32px] p-6 h-44 flex flex-col justify-between">
                        <div className="w-32 h-4 rounded-full bg-black/5" />
                        <div className="flex gap-2">
                            <div className="flex-1 h-12 rounded-2xl bg-black/5" />
                            <div className="flex-1 h-12 rounded-2xl bg-black/5" />
                            <div className="flex-1 h-12 rounded-2xl bg-black/5" />
                        </div>
                    </div>
                    <div className="rounded-[32px] p-6 h-44 bg-gradient-to-br from-[#1C1F1D] to-[#2A2E2C] flex flex-col justify-between">
                        <div className="w-24 h-4 rounded-full bg-white/10" />
                        <div className="w-48 h-8 rounded-xl bg-white/10" />
                        <div className="w-full h-12 rounded-2xl bg-white/20" />
                    </div>
                </div>
                {/* About Box skeleton */}
                <div className="bg-white/50 border border-white/60 p-6 md:p-8 rounded-[32px] shadow-sm max-w-3xl mx-auto">
                    <div className="w-36 h-4 rounded-full bg-black/5 mb-6" />
                    <div className="space-y-3 mb-6">
                        <div className="w-full h-4 rounded bg-black/5" />
                        <div className="w-5/6 h-4 rounded bg-black/5" />
                        <div className="w-4/6 h-4 rounded bg-black/5" />
                    </div>
                </div>
            </div>
        );
    }

    const selectedOption = treatment.options[selectedOptionIdx] || treatment.options[0];
    const isCoupleTreatment = ['couple', 'honeymoon'].some(k => treatment.title.toLowerCase().includes(k));

    // Calculate smart price
    const subtotalPrice = cartItems.reduce((acc, item) => {
        const isCouple = ['couple', 'honeymoon'].some(k => item.title.toLowerCase().includes(k));
        const multiplier = isCouple ? (item.guests / 2) : item.guests;
        return acc + (item.price * multiplier);
    }, 0);

    let discountAmount = 0;
    if (appliedPromo) {
        if (appliedPromo.discount_type === 'percentage') {
            discountAmount = subtotalPrice * (appliedPromo.discount_value / 100);
        } else {
            discountAmount = appliedPromo.discount_value;
        }
    }
    const totalPrice = Math.max(0, subtotalPrice - discountAmount);
    const formattedTotalPrice = totalPrice.toLocaleString('en-US');

    const handleBooking = async (e?: React.FormEvent) => {
        if (e && e.preventDefault) e.preventDefault();
        
        if (cartItems.length === 0) {
            alert('Your booking list is empty. Please select a treatment.');
            return;
        }

        if (!formData.name || !formData.date || !formData.time || !formData.location || (isTherapick && !formData.whatsapp)) {
            alert(`Please fill in all required fields (Name, Date, Time, Location${isTherapick ? ', WhatsApp Number' : ''}).`);
            return;
        }

        // Apply promo usages
        if (appliedPromo) {
            try {
                await supabase.rpc('increment_promo_use', { promo_id: appliedPromo.id });
            } catch (err) {
                console.error('Failed to increment promo use', err);
            }
        }

        // Open window synchronously to bypass popup blockers
        const newWindow = window.open('', '_blank');
        setIsProcessing(true);

        try {
            const tableFee = isTherapick ? (massageTableCount * 100000) : 0;
            const pricing = calculateCartTotal(cartItems, appliedPromo, tableFee);
            const currentTotal = pricing.total;
            const subtotalPrice = pricing.subtotal;
            const waNumber = '6285174119423';
            
            const rawHost = typeof window !== 'undefined' ? window.location.hostname : 'booktherapick.com';
            const cleanHost = rawHost.replace(/^https?:\/\//, '').replace(/\/$/, '');
            const websiteSource = cleanHost.startsWith('www.') ? cleanHost : `www.${cleanHost}`;
            
            let promoDetailsText = '';
            if (appliedPromo) {
                promoDetailsText = `\n\n*PROMO APPLIED:*\n• Code: ${appliedPromo.code}\n• Discount: ${appliedPromo.discount_type === 'percentage' ? appliedPromo.discount_value + '%' : 'IDR ' + appliedPromo.discount_value.toLocaleString('en-US')}\n• Subtotal: IDR ${subtotalPrice.toLocaleString('en-US')}`;
            }

            let baseMessage = '';
            if (isTherapick) {
                const tableChoice = massageTableCount > 0 
                    ? `${massageTableCount} Portable Table${massageTableCount > 1 ? 's' : ''} (+IDR ${(massageTableCount * 100000).toLocaleString('en-US')})` 
                    : 'Villa Bed / Floor Mat Setup (IDR 0)';

                const treatmentsList = cartItems.map((item, idx) => {
                    const isCouple = ['couple', 'honeymoon'].some(k => item.title.toLowerCase().includes(k));
                    const multiplier = isCouple ? (item.guests / 2) : item.guests;
                    const addonsTotal = (item.addons || []).reduce((sum: number, a: any) => sum + (Number(a.price) || 0), 0);
                    const itemTotal = ((item.price + addonsTotal) * multiplier).toLocaleString('en-US');

                    const guestAndPriceText = isCouple 
                        ? (item.guests === 2 ? `1 COUPLE (2 Persons)\nIDR ${itemTotal}` : `${item.guests / 2} COUPLES (${item.guests} Persons)\nIDR ${itemTotal}`)
                        : `${item.guests} PERSON${item.guests > 1 ? 'S' : ''}\nIDR ${itemTotal}`;

                    let addonsListText = '';
                    if (item.addons && item.addons.length > 0) {
                        addonsListText = `\n*ADD-ONS:* ` + item.addons.map((a: any) => `${a.title} (+IDR ${Number(a.price).toLocaleString('en-US')})`).join(', ');
                    }

                    return `*${idx + 1}. ${item.title.toUpperCase()}*\nDURATION: ${item.duration} MINS\n${guestAndPriceText}${addonsListText}`;
                }).join('\n\n------------------------\n\n');

                baseMessage = `*NEW SPA BOOKING*\n${websiteSource}\n\n*TREATMENTS:*\n${treatmentsList}\n\n*SETUP PREFERENCE:* ${tableChoice}\n\n*TOTAL PRICE:* IDR ${currentTotal.toLocaleString('en-US')}${promoDetailsText}\n\n*CLIENT DETAILS:*\n• Name: ${formData.name}\n• Date: ${formData.date}\n• Time: ${formData.time}\n• Location/Villa: ${formData.location}\n• Room Number: ${formData.room || 'N/A'}\n• WhatsApp: ${formData.whatsapp || 'N/A'}\n\nHello! I would like to confirm this booking.`;
            } else {
                const treatmentsList = cartItems.map(item => {
                    const isCouple = ['couple', 'honeymoon'].some(k => item.title.toLowerCase().includes(k));
                    const multiplier = isCouple ? (item.guests / 2) : item.guests;
                    const price = (item.price * multiplier).toLocaleString('en-US');
                    const itemTreatment = treatments.find(t => t.id === item.treatmentId || t.title === item.title) || treatment;

                    let whatsIncludedText = '';
                    if (itemTreatment && itemTreatment.desc) {
                        const parts = itemTreatment.desc.split(/What's Included\s*:?\s*/i);
                        if (parts.length > 1) {
                            const cleanIncluded = parts[1].trim();
                            whatsIncludedText = `\n\n*WHAT'S INCLUDED:*\n${cleanIncluded}`;
                        }
                    }

                    const guestAndPriceText = isCouple
                        ? (item.guests === 2 ? `1 COUPLE\n2 PERSONS\nIDR ${price}` : `${item.guests / 2} COUPLES\n${item.guests} PERSONS\nIDR ${price}`)
                        : `${item.guests} PERSON${item.guests > 1 ? 'S' : ''} IDR ${price}`;

                    return `*${item.title.toUpperCase()}*\nDURATION ${item.duration} MINS\n${guestAndPriceText}${whatsIncludedText}`;
                }).join('\n\n------------------------\n\n');

                baseMessage = `*NEW SPA BOOKING*\n${websiteSource}\n\n*TREATMENTS:*\n${treatmentsList}\n\n*TOTAL PRICE:* IDR ${currentTotal.toLocaleString('en-US')}${promoDetailsText}\n\n*CLIENT DETAILS:*\n• Name: ${formData.name}\n• Date: ${formData.date}\n• Time: ${formData.time}\n• Location/Villa: ${formData.location}\n• Room Number: ${formData.room || 'N/A'}\n\nHello! I would like to confirm this booking.`;
            }

            // Save to Supabase before opening WhatsApp
            const activeBrand = treatment?.brand || siteBrandFilter || 'therapick';
            await saveBookingToSupabase(
                bookingIdRef.current,
                formData,
                cartItems,
                currentTotal,
                activeBrand
            );

            const finalMessage = baseMessage + '\n\n*BOOKING ID :* ' + bookingIdRef.current;
            
            saveDraft({
                id: bookingIdRef.current,
                date: new Date().toISOString(),
                status: 'confirmed',
                items: cartItems,
                customerDetails: formData,
                totalPrice: currentTotal
            });
    
            const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(finalMessage)}`;
            if (newWindow) {
                newWindow.location.href = waUrl;
            } else {
                window.location.href = waUrl;
            }
            
            setCartItems([]);
            setIsModalOpen(false);
            setIsReviewingBooking(false);
            setTherapickStep('selection');
        } catch (error) {
            console.error(error);
            if (newWindow) newWindow.close();
            alert('An error occurred while generating the booking message. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleApplyPromo = async () => {
        if (!promoCodeInput.trim()) return;
        setIsPromoLoading(true);
        setPromoError('');
        setPromoSuccess('');
        try {
            const { data, error } = await supabase
                .from('promo_codes')
                .select('*')
                .eq('code', promoCodeInput.trim().toUpperCase())
                .eq('brand', siteBrandFilter)
                .eq('is_active', true)
                .single();
            
            if (error || !data) {
                setPromoError('Invalid or expired promo code');
                setAppliedPromo(null);
            } else {
                if (data.max_uses > 0 && data.current_uses >= data.max_uses) {
                    setPromoError('Promo code usage limit reached');
                    setAppliedPromo(null);
                } else {
                    setAppliedPromo(data);
                    setPromoSuccess('Promo code applied successfully!');
                }
            }
        } catch (err) {
            setPromoError('Error verifying promo code');
        } finally {
            setIsPromoLoading(false);
        }
    };

    const handleRemovePromo = () => {
        setAppliedPromo(null);
        setPromoCodeInput('');
        setPromoSuccess('');
        setPromoError('');
    };

    const handleInitialBook = () => {
        setCartItems([{
            id: Date.now().toString(),
            treatmentId: treatment.id,
            title: treatment.title,
            duration: selectedOption.duration,
            price: parseInt(selectedOption.price.replace(/,/g, '') || '0'),
            guests: isCoupleTreatment ? 2 : 1
        }]);
        setIsSelectingMore(false);
        setIsReviewingBooking(false);
        setTherapickStep('selection');
        setIsModalOpen(true);
    };



    const handleShare = async () => {
        const isTherapick = siteBrandFilter === 'therapick' || (typeof window !== 'undefined' && (window.location.hostname.includes('therapick') || window.location.hostname.includes('booktherapick')));
        const isBali = siteBrandFilter === 'bali' || (typeof window !== 'undefined' && window.location.hostname.includes('homespaubud'));
        const brandName = isTherapick ? 'Therapick Bali' : (isBali ? 'Home Spa Ubud' : 'Elexoir Home Spa');

        const shareData = {
            title: `${treatment.title} | ${brandName}`,
            text: isTherapick
                ? `Book ${treatment.title} with Therapick Bali:`
                : (isBali ? `Book ${treatment.title} at Home Spa Ubud:` : `Book ${treatment.title} at Elexoir Home Spa Ubud:`),
            url: window.location.href,
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(window.location.href);
                alert('Link copied to clipboard!');
            }
        } catch (err) {
            console.error('Error sharing:', err);
        }
    };

    const relatedTreatments = treatments.filter(t => t.id !== treatment.id).slice(0, 3);

    return (
        <div className="min-h-screen bg-background relative overflow-hidden font-sans text-text pb-24 md:pb-12 pt-16 md:pt-24">
            
            <div className="max-w-3xl mx-auto px-6 md:px-8">
                
                {/* Header Actions */}
                <header className="flex items-center justify-between mb-16">
                    <Link href="/">
                        <button className="w-12 h-12 rounded-full bg-white border border-border/50 flex items-center justify-center text-primary shadow-[0_8px_20px_rgb(0,0,0,0.04)] hover:bg-surface hover:scale-105 transition-all">
                            <ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
                        </button>
                    </Link>
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={handleShare}
                            className="w-12 h-12 rounded-full bg-white/50 backdrop-blur-sm border border-border/30 flex items-center justify-center text-primary hover:bg-white hover:scale-105 transition-all shadow-[0_8px_20px_rgb(0,0,0,0.02)]"
                        >
                            <Share className="w-5 h-5" strokeWidth={2} />
                        </button>
                    </div>
                </header>

                {/* Title & Location */}
                <div className="mb-8">
                    <h1 className="font-serif text-4xl md:text-6xl text-primary leading-[1.1] mb-4 tracking-tight">
                        {treatment.title}
                    </h1>
                </div>

                {/* Smart Pricing & Duration Bento Grid */}
                <div data-reveal className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10 scroll-reveal">
                    
                    {/* Selectable Durations */}
                    <div className="bg-white/40 border border-highlight rounded-[32px] p-6 flex flex-col justify-between">
                        <div className="flex items-start justify-between mb-6">
                            <span className="text-sm font-bold uppercase tracking-widest text-primary/80">Select Duration</span>
                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-primary shadow-sm">
                                <Clock className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {treatment.options.map((opt: any, idx: number) => {
                                const isActive = selectedOptionIdx === idx;
                                return (
                                    <button 
                                        key={idx}
                                        onClick={() => setSelectedOptionIdx(idx)}
                                        className={`flex-1 py-3 px-2 rounded-2xl text-sm font-bold transition-all duration-300 ${
                                            isActive 
                                            ? 'bg-primary text-white shadow-[0_8px_20px_rgb(0,0,0,0.12)] scale-105' 
                                            : 'bg-white/60 text-primary border border-white hover:bg-white hover:scale-[1.02]'
                                        }`}
                                    >
                                        {opt.duration} <span className={`text-[10px] ${isActive ? 'text-white/70' : 'text-primary/50'}`}>MINS</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Price & Action */}
                    <div className="rounded-[32px] p-6 flex flex-col justify-between relative overflow-hidden shadow-soft-lg min-h-[160px] bg-gradient-to-br from-[#1C1F1D] via-[#2A2E2C] to-[#1C1F1D]">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_50%)] pointer-events-none"></div>
                        
                        <div className="relative z-10 flex flex-col h-full justify-between gap-6">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1">
                                    {isCoupleTreatment ? 'Price for 2 persons' : 'Price per person'}
                                </span>
                                <AnimatePresence mode="popLayout">
                                    <motion.div 
                                        key={selectedOption.price}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="flex items-baseline gap-2 text-white"
                                    >
                                        <span className="text-lg font-medium text-white/70">IDR</span>
                                        <span className="text-4xl md:text-5xl font-serif">{parseInt(selectedOption.price.replace(/,/g, '') || '0').toLocaleString('en-US')}</span>
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                            <button 
                                onClick={handleInitialBook}
                                className="w-full bg-white text-primary px-6 py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-white/90 hover:scale-[1.02] transition-all duration-300 shadow-[0_8px_24px_rgb(255,255,255,0.15)] uppercase tracking-widest"
                            >
                                Book an Appointment
                            </button>
                        </div>
                    </div>

                </div>

                {/* Description & SEO Content */}
                <section data-reveal className="mb-14 bg-white/50 backdrop-blur-xl border border-white/60 p-6 md:p-8 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.02)] scroll-reveal">
                    <h2 className="text-sm font-bold tracking-widest text-primary mb-4 uppercase">About this Treatment</h2>
                    <p className="text-sm md:text-base text-text-muted leading-relaxed font-light mb-8 whitespace-pre-wrap">
                        {treatment.desc.replace(/What's Included\s*:?\s*/gi, "WHAT'S_INCLUDED_SPLIT").split("WHAT'S_INCLUDED_SPLIT").map((part, i) => (
                            i === 0 ? <span key={i}>{part}</span> : (
                                <React.Fragment key={i}>
                                    <span className="font-bold uppercase text-primary tracking-widest block mt-8 mb-3">WHAT'S INCLUDED</span>
                                    <span>{part.replace(/^[:\s]+/, '')}</span>
                                </React.Fragment>
                            )
                        ))}
                    </p>
                    
                    {treatment.benefits && treatment.benefits.length > 0 && (
                        <>
                            <h3 className="text-sm font-bold tracking-widest text-primary mb-4 uppercase">Key Benefits</h3>
                            <ul className="space-y-3 mb-8">
                                {treatment.benefits.map((benefit, idx) => (
                                    <li key={idx} className="flex items-start gap-3">
                                        <div className="mt-1 w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0"></div>
                                        <span className="text-sm md:text-base text-text-muted font-light">{benefit}</span>
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-border/30">
                        <div>
                            <h3 className="text-sm font-bold tracking-widest text-primary mb-3 uppercase">
                                Recommended For
                            </h3>
                            <p className="text-sm text-text-muted leading-relaxed font-light">
                                Perfect for those experiencing muscle tension, travel fatigue, or seeking profound relaxation during their Bali holiday. Ideal for couples, honeymooners, and wellness enthusiasts looking for an authentic, premium mobile spa experience.
                            </p>
                        </div>
                        <div>
                            <h3 className="text-sm font-bold tracking-widest text-primary mb-3 uppercase">
                                Expected Results
                            </h3>
                            <p className="text-sm text-text-muted leading-relaxed font-light">
                                Immediate relief from physical stress and mental fatigue. Promotes improved blood circulation, deeper sleep, restored energy levels, and a lasting sense of holistic wellbeing perfectly aligned with the tranquil spirit of Bali.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Related (Dynamic from Supabase) */}
                {relatedTreatments.length > 0 && (
                <section data-reveal className="scroll-reveal">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-primary">Related Treatments</h3>
                        <Link href="/" className="text-xs font-bold text-text-muted hover:text-primary transition-colors">VIEW ALL</Link>
                    </div>
                    
                    <div className="flex overflow-x-auto pb-6 -mx-6 px-6 md:mx-0 md:px-0 gap-4 no-scrollbar scroll-reveal-stagger">
                        {relatedTreatments.map((item, idx) => (
                            <Link href={`/rituals/${createSlug(item.title)}`} key={idx} className="w-72 shrink-0 block group outline-none">
                                <div className={`rounded-[32px] bg-gradient-to-br ${item.bgPattern || 'from-secondary/80 to-highlight/40'} border border-border/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-700 flex flex-col h-full relative overflow-hidden group-hover:-translate-y-2 p-6`}>
                                    
                                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/60 blur-[30px] rounded-full pointer-events-none transition-transform duration-700 group-hover:scale-150"></div>

                                    <div className="mb-6 flex items-start justify-between relative z-10">
                                        <div className="bg-white/60 backdrop-blur-sm border border-primary/10 text-primary px-3 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase shadow-sm">
                                            {item.category}
                                        </div>
                                    </div>

                                    <div className="relative z-10 flex-grow flex flex-col">
                                        <h4 className="font-serif text-xl font-medium text-primary mb-2 leading-tight">{item.title}</h4>
                                        <p className="text-xs text-text-muted leading-relaxed font-light mb-5 flex-grow line-clamp-3">
                                            {item.desc.charAt(0).toUpperCase() + item.desc.slice(1).toLowerCase()}
                                        </p>
                                        
                                        <div className="mt-auto pt-4 border-t border-border/50">
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-text-muted mb-3 uppercase tracking-widest">
                                                <Clock className="w-3.5 h-3.5" /> {item.options && item.options[0] ? item.options[0].duration : '60'} MINS
                                            </div>
                                            <div className="flex items-center justify-between bg-white/80 backdrop-blur-sm rounded-full p-1 pl-4 border border-gray-100">
                                                <span className="font-semibold text-gray-900 text-[14px]">IDR {item.options && item.options[0] ? parseInt(item.options[0].price.replace(/,/g, '') || '0').toLocaleString('en-US') : '0'}</span>
                                                <button className="w-10 h-10 rounded-full bg-[#1D1D1F] text-white flex items-center justify-center hover:bg-black transition-colors shrink-0 shadow-sm">
                                                    <Plus size={20} strokeWidth={2.5} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
                )}

            </div>

            {/* WhatsApp Booking Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center px-0 md:px-4 bg-black/40 backdrop-blur-sm"
                    >
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white w-full max-w-full sm:max-w-lg h-[100dvh] sm:h-auto sm:max-h-[90vh] sm:my-auto sm:rounded-[28px] rounded-none p-5 sm:p-7 md:p-8 shadow-2xl relative flex flex-col box-border overflow-y-auto overflow-x-hidden no-scrollbar"
                        >
                            <button 
                                onClick={() => {
                                    if (cartItems.length > 0) {
                                        saveDraft({
                                            id: bookingIdRef.current,
                                            date: new Date().toISOString(),
                                            status: 'draft',
                                            items: cartItems,
                                            customerDetails: formData,
                                            totalPrice: calculateCartTotal(cartItems, appliedPromo).total
                                        });
                                    }
                                    setIsModalOpen(false);
                                }}
                                className="absolute top-6 right-6 w-8 h-8 rounded-full bg-white border border-border flex items-center justify-center text-text-muted hover:bg-border transition-colors z-10 shadow-sm"
                            >
                                <X className="w-4 h-4" />
                            </button>
                            
                            {isSelectingMore ? (
                                <div className="animate-in fade-in slide-in-from-right-4 duration-300 pb-4">
                                    <div className="flex items-center gap-4 mb-6">
                                        <button onClick={() => setIsSelectingMore(false)} className="w-8 h-8 rounded-full bg-white border border-border flex items-center justify-center hover:bg-border transition-colors shrink-0 shadow-sm">
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>
                                        <h2 className="font-serif text-2xl text-primary">Select Treatment</h2>
                                    </div>
                                    
                                    <div className="space-y-3 max-h-[calc(100dvh-110px)] md:max-h-[70vh] overflow-y-auto pr-2 pb-16 no-scrollbar">
                                        {treatments.map(t => (
                                            <div 
                                                key={t.id} 
                                                className={`bg-white border ${expandedTreatmentId === t.id ? 'border-primary' : 'border-border/80'} rounded-2xl overflow-hidden shadow-sm transition-all`}
                                            >
                                                <div 
                                                    onClick={() => setExpandedTreatmentId(expandedTreatmentId === t.id ? null : t.id)}
                                                    className="p-3 flex gap-4 hover:bg-black/[0.02] cursor-pointer group"
                                                >
                                                    <div className="flex-1 py-1 pl-2">
                                                        <div className="text-[9px] font-bold tracking-widest text-primary/50 uppercase mb-1">{t.category}</div>
                                                        <h4 className="font-bold text-sm text-primary mb-1 line-clamp-1">{t.title}</h4>
                                                        <div className="text-[10px] text-text-muted"><Clock className="w-3 h-3 inline mr-1" />{t.options.length} Options</div>
                                                    </div>
                                                    <div className="flex items-center pr-2">
                                                        <div className={`w-8 h-8 rounded-full bg-white border border-border flex items-center justify-center text-primary transition-all duration-300 ${expandedTreatmentId === t.id ? 'rotate-45 bg-primary text-white' : 'group-hover:bg-primary group-hover:text-white'}`}>
                                                            <Plus className="w-4 h-4" />
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <AnimatePresence>
                                                    {expandedTreatmentId === t.id && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            className="border-t border-border/50 bg-white"
                                                        >
                                                            <div className="p-4 space-y-4">
                                                                <p className="text-xs text-text-muted leading-relaxed">{t.desc}</p>
                                                                <div className="space-y-2">
                                                                    <div className="text-[10px] font-bold uppercase tracking-widest text-primary/80 mb-2">Select Duration</div>
                                                                    {t.options.map((opt: any, idx: number) => (
                                                                        <button
                                                                            key={idx}
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                const isCouple = ['couple', 'honeymoon'].some(k => t.title.toLowerCase().includes(k));
                                                                                setCartItems([...cartItems, {
                                                                                    id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                                                                                    treatmentId: t.id,
                                                                                    title: t.title,
                                                                                    duration: opt.duration,
                                                                                    price: parseInt(opt.price.replace(/,/g, '') || '0'),
                                                                                    guests: isCouple ? 2 : 1
                                                                                }]);
                                                                                setExpandedTreatmentId(null);
                                                                                setIsSelectingMore(false);
                                                                            }}
                                                                            className="w-full flex items-center justify-between p-3 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group"
                                                                        >
                                                                            <span className="text-sm font-bold text-primary group-hover:text-primary transition-colors">{opt.duration} Mins</span>
                                                                            <span className="text-sm font-serif text-primary">IDR {parseInt(opt.price.replace(/,/g, '') || '0').toLocaleString('en-US')}</span>
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        ))}
                                        <div className="text-center pt-2 pb-8">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted/50 flex items-center justify-center gap-2">
                                                Scroll for more treatments <ArrowRight className="w-3 h-3 rotate-90" />
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ) : isTherapick ? (
                                /* =================== THERAPICK BOOKING FLOW (booktherapick.com) =================== */
                                <div className="animate-in fade-in slide-in-from-left-4 duration-300 flex flex-col max-h-[85vh] sm:max-h-[70vh] overflow-y-auto overflow-x-hidden no-scrollbar pb-4 pr-1">
                                    {therapickStep === 'selection' && (
                                        <>
                                            <div className="mb-5 pr-8 relative">
                                                <h2 className="font-serif text-2xl sm:text-3xl text-primary font-medium tracking-tight mb-1">YOUR SPA SELECTION</h2>
                                                <p className="text-xs text-text-muted">Review treatments and choose your massage setup.</p>
                                            </div>

                                            {/* Cart Items List */}
                                            <div className="space-y-3 mb-5">
                                                {cartItems.map(item => {
                                                    const addonsTotal = (item.addons || []).reduce((s: number, a: any) => s + (Number(a.price) || 0), 0);
                                                    const singlePrice = item.price + addonsTotal;
                                                    return (
                                                    <div key={item.id} className="bg-white border border-border/80 rounded-2xl p-4 sm:p-5 shadow-sm relative">
                                                        <div className="flex items-start justify-between mb-3 pr-6">
                                                            <div>
                                                                <h3 className="font-bold text-sm text-primary leading-tight">{item.title}</h3>
                                                                <p className="text-xs text-text-muted flex items-center gap-1 mt-1 mb-1">
                                                                    <Clock className="w-3 h-3" /> {item.duration} Mins
                                                                </p>

                                                                {/* Selected Add-ons displayed directly below massage title */}
                                                                {item.addons && item.addons.length > 0 && (
                                                                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                                                                        {item.addons.map((addon: any) => (
                                                                            <span 
                                                                                key={addon.id}
                                                                                className="inline-flex items-center gap-1 bg-stone-100 text-stone-800 border border-stone-200 text-[10px] font-medium px-2 py-0.5 rounded-full"
                                                                            >
                                                                                <span>+ {addon.title} (+IDR {Number(addon.price).toLocaleString('en-US')})</span>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => {
                                                                                        setCartItems(cartItems.map(i => {
                                                                                            if (i.id !== item.id) return i;
                                                                                            return {
                                                                                                ...i,
                                                                                                addons: (i.addons || []).filter((a: any) => a.id !== addon.id)
                                                                                            };
                                                                                        }));
                                                                                    }}
                                                                                    className="hover:text-red-500 transition-colors ml-0.5"
                                                                                >
                                                                                    <X className="w-2.5 h-2.5" />
                                                                                </button>
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <span className="font-serif text-primary font-medium text-right flex flex-col shrink-0">
                                                                IDR {singlePrice.toLocaleString('en-US')}
                                                                <span className="text-[10px] font-sans text-text-muted font-normal uppercase tracking-wider">
                                                                    {['couple', 'honeymoon'].some(k => item.title.toLowerCase().includes(k)) ? 'For 2 Persons' : 'Per Person'}
                                                                </span>
                                                            </span>
                                                        </div>

                                                        {/* Guests Selector & Add-on Button on the same row */}
                                                        <div className="flex items-center justify-between pt-2.5 pb-1 border-t border-border/50">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] font-bold uppercase tracking-widest text-primary/80">Guests</span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setOpenAddonItemId(openAddonItemId === item.id ? null : item.id)}
                                                                    className="text-[10px] font-bold uppercase tracking-wider text-primary border border-border/80 hover:border-primary px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 bg-stone-50 hover:bg-stone-100 shadow-2xs"
                                                                >
                                                                    <Plus className="w-3 h-3" /> {openAddonItemId === item.id ? 'Close' : 'Add-on'}
                                                                </button>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const newCart = cartItems.filter(i => i.id !== item.id);
                                                                        setCartItems(newCart);
                                                                        if (newCart.length === 0) {
                                                                            setIsModalOpen(false);
                                                                            setTherapickStep('selection');
                                                                        }
                                                                    }}
                                                                    className="w-8 h-8 rounded-full bg-white border border-border flex items-center justify-center text-text-muted hover:text-red-500 hover:border-red-200 transition-colors shadow-sm"
                                                                    title="Remove treatment"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                                <div className="w-px h-5 bg-border mx-1"></div>
                                                                <div className="flex items-center gap-2">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setCartItems(cartItems.map(i => {
                                                                            if (i.id !== item.id) return i;
                                                                            const isCouple = ['couple', 'honeymoon'].some(k => i.title.toLowerCase().includes(k));
                                                                            const step = isCouple ? 2 : 1;
                                                                            return { ...i, guests: Math.max(step, i.guests - step) };
                                                                        }))}
                                                                        className="w-8 h-8 rounded-full bg-white border border-border flex items-center justify-center text-primary hover:bg-border transition-colors shadow-sm"
                                                                    >
                                                                        <Minus className="w-3 h-3" />
                                                                    </button>
                                                                    <span className="font-bold text-sm text-primary w-4 text-center">{item.guests}</span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setCartItems(cartItems.map(i => {
                                                                            if (i.id !== item.id) return i;
                                                                            const isCouple = ['couple', 'honeymoon'].some(k => i.title.toLowerCase().includes(k));
                                                                            const step = isCouple ? 2 : 1;
                                                                            return { ...i, guests: i.guests + step };
                                                                        }))}
                                                                        className="w-8 h-8 rounded-full bg-white border border-border flex items-center justify-center text-primary hover:bg-border transition-colors shadow-sm"
                                                                    >
                                                                        <Plus className="w-3 h-3" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Expandable Add-ons Selection */}
                                                        <AnimatePresence>
                                                            {openAddonItemId === item.id && (
                                                                <motion.div
                                                                    initial={{ opacity: 0, height: 0 }}
                                                                    animate={{ opacity: 1, height: 'auto' }}
                                                                    exit={{ opacity: 0, height: 0 }}
                                                                    className="mt-3 bg-stone-50 border border-border/60 rounded-xl p-3 space-y-2 overflow-hidden"
                                                                >
                                                                    <div className="text-[10px] font-bold uppercase tracking-wider text-primary/70 mb-1">
                                                                        Select Add-ons for this treatment
                                                                    </div>
                                                                    {availableAddons.length === 0 ? (
                                                                        <div className="text-center py-3 text-xs text-text-muted">
                                                                            No add-on options configured yet. Add them in the Therapick Admin Dashboard.
                                                                        </div>
                                                                    ) : (
                                                                        availableAddons.map((addon) => {
                                                                            const isAdded = (item.addons || []).some((a: any) => a.id === addon.id);
                                                                            return (
                                                                                <div 
                                                                                    key={addon.id} 
                                                                                    className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-border/50 text-xs"
                                                                                >
                                                                                    <div className="pr-2">
                                                                                        <div className="font-semibold text-primary">{addon.title}</div>
                                                                                        <div className="text-[10px] text-text-muted">{addon.duration} • IDR {Number(addon.price).toLocaleString('en-US')}</div>
                                                                                    </div>
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => {
                                                                                            setCartItems(cartItems.map(i => {
                                                                                                if (i.id !== item.id) return i;
                                                                                                const existing = i.addons || [];
                                                                                                const nextAddons = isAdded 
                                                                                                    ? existing.filter((a: any) => a.id !== addon.id)
                                                                                                    : [...existing, addon];
                                                                                                return { ...i, addons: nextAddons };
                                                                                            }));
                                                                                        }}
                                                                                        className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all ${
                                                                                            isAdded 
                                                                                                ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                                                                                                : 'bg-primary text-white hover:bg-primary/90'
                                                                                        }`}
                                                                                    >
                                                                                        {isAdded ? 'Remove' : '+ Add'}
                                                                                    </button>
                                                                                </div>
                                                                            );
                                                                        })
                                                                    )}
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                    );
                                                })}
                                            </div>

                                            {/* Add another treatment button */}
                                            <button
                                                type="button"
                                                onClick={() => setIsSelectingMore(true)}
                                                className="w-full bg-white text-primary border border-border/80 px-6 py-3.5 rounded-xl text-xs font-bold shadow-sm hover:bg-white transition-colors mb-4 tracking-widest uppercase"
                                            >
                                                + Add Another Treatment
                                            </button>

                                            {/* Massage Table Setup with - and + counter & Professional Explanation */}
                                            <div className="bg-white border border-border/80 rounded-2xl p-4 sm:p-5 shadow-xs mb-4">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div>
                                                        <h4 className="text-xs font-bold text-primary uppercase tracking-wider">Massage Table Setup</h4>
                                                        <p className="text-[11px] text-text-muted mt-0.5">
                                                            Professional portable massage table brought to your villa
                                                        </p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowTableFeeInfo(!showTableFeeInfo)}
                                                        className="text-[10px] font-semibold text-primary/70 hover:text-primary transition-colors flex items-center gap-1 bg-stone-100 hover:bg-stone-200/80 px-2.5 py-1 rounded-full shrink-0"
                                                        title="Read why there is an additional fee"
                                                    >
                                                        <Info className="w-3 h-3 text-primary/70" />
                                                        <span>Why a fee?</span>
                                                    </button>
                                                </div>

                                                {/* Notification Description explaining the fee */}
                                                <AnimatePresence>
                                                    {showTableFeeInfo && (
                                                        <motion.div
                                                            initial={{ opacity: 0, height: 0 }}
                                                            animate={{ opacity: 1, height: 'auto' }}
                                                            exit={{ opacity: 0, height: 0 }}
                                                            className="mb-3.5 bg-stone-50 border border-border/70 rounded-xl p-3.5 text-xs text-text-muted leading-relaxed"
                                                        >
                                                            <div className="flex items-start justify-between gap-2 mb-1.5">
                                                                <span className="font-bold text-primary text-[11px] uppercase tracking-wider">
                                                                    Portable Equipment & Scooter Logistics
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setShowTableFeeInfo(false)}
                                                                    className="text-text-muted hover:text-primary"
                                                                >
                                                                    <X className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                            <p className="text-[11px] text-stone-600 leading-normal">
                                                                Our therapists bring full-sized, professional spa massage tables, clean sanitized linens, and specialized equipment directly to your villa. Because our therapists travel independently across Bali by motor scooter carrying heavy portable equipment through traffic and villa pathways, this modest surcharge (IDR 100,000 per person) directly supports their dedicated transport logistics and careful setup for your comfort.
                                                            </p>
                                                            <p className="text-[10px] text-stone-500 mt-1.5 italic">
                                                                If you prefer no additional fee, simply leave this at 0 to enjoy your treatment comfortably on your villa bed or mattress.
                                                            </p>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>

                                                {/* Table Counter Row */}
                                                <div className="flex items-center justify-between p-3.5 rounded-xl bg-stone-50/70 border border-border/60">
                                                    <div>
                                                        <div className="font-bold text-xs text-primary">Bring Portable Table</div>
                                                        <div className="text-[11px] text-text-muted mt-0.5">
                                                            {massageTableCount > 0 
                                                                ? `${massageTableCount} Table${massageTableCount > 1 ? 's' : ''} (+IDR ${(massageTableCount * 100000).toLocaleString('en-US')})`
                                                                : '0 Tables (Using Villa Bed / Floor Mat • IDR 0)'
                                                            }
                                                        </div>
                                                        <div className="text-[10px] text-stone-400 font-medium">
                                                            IDR 100,000 per person / table
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => setMassageTableCount(Math.max(0, massageTableCount - 1))}
                                                            disabled={massageTableCount <= 0}
                                                            className="w-8 h-8 rounded-full bg-white border border-border/80 flex items-center justify-center text-primary hover:bg-stone-100 disabled:opacity-40 transition-colors shadow-2xs"
                                                        >
                                                            <Minus className="w-3.5 h-3.5" />
                                                        </button>
                                                        <span className="font-bold text-sm text-primary w-5 text-center tabular-nums">
                                                            {massageTableCount}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => setMassageTableCount(massageTableCount + 1)}
                                                            className="w-8 h-8 rounded-full bg-white border border-border/80 flex items-center justify-center text-primary hover:bg-stone-100 transition-colors shadow-2xs"
                                                        >
                                                            <Plus className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Promo Code Input - Displayed on this section only */}
                                            <div className="bg-white border border-border/80 rounded-2xl p-4 shadow-xs mb-5">
                                                <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-primary/80 mb-2">
                                                    <Tag className="w-3.5 h-3.5"/> Promo Code (Optional)
                                                </label>
                                                <div className="flex gap-2 w-full">
                                                    <input 
                                                        type="text" placeholder="ENTER CODE"
                                                        value={promoCodeInput} onChange={e => setPromoCodeInput(e.target.value.toUpperCase())}
                                                        disabled={!!appliedPromo || isPromoLoading}
                                                        className="w-full bg-stone-50/60 border border-border/80 rounded-xl px-4 py-2.5 text-xs text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all uppercase tracking-wider font-medium"
                                                    />
                                                    {appliedPromo ? (
                                                        <button type="button" onClick={handleRemovePromo} className="px-4 bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors uppercase tracking-wider whitespace-nowrap">
                                                            Remove
                                                        </button>
                                                    ) : (
                                                        <button type="button" onClick={handleApplyPromo} disabled={!promoCodeInput.trim() || isPromoLoading} className="px-5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider whitespace-nowrap">
                                                            {isPromoLoading ? 'Applying...' : 'Apply'}
                                                        </button>
                                                    )}
                                                </div>
                                                {promoError && <p className="text-xs text-red-500 mt-1.5 ml-1">{promoError}</p>}
                                                {promoSuccess && <p className="text-xs text-emerald-600 mt-1.5 ml-1">{promoSuccess}</p>}
                                            </div>

                                            {/* Price & Continue */}
                                            <div className="pt-4 border-t border-border/50">
                                                <div className="flex items-end justify-between mb-5">
                                                    <span className="text-xs font-bold text-primary uppercase tracking-widest">Total Price</span>
                                                    <span className="text-2xl font-serif text-primary font-medium">
                                                        IDR {calculateCartTotal(cartItems, appliedPromo, massageTableCount * 100000).total.toLocaleString('en-US')}
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setTherapickStep('details')}
                                                    className="w-full bg-black hover:bg-neutral-800 text-white px-6 py-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:scale-[1.01] transition-all shadow-md uppercase tracking-widest"
                                                >
                                                    <span>Continue to Guest Details</span>
                                                    <ArrowRight className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </>
                                    )}

                                    {therapickStep === 'details' && (
                                        <>
                                            <div className="mb-5 pr-8 relative">
                                                <button
                                                    type="button"
                                                    onClick={() => setTherapickStep('selection')}
                                                    className="inline-flex items-center gap-1 text-xs font-bold text-text-muted hover:text-primary uppercase tracking-wider mb-2"
                                                >
                                                    <ChevronLeft className="w-4 h-4" /> Back to Treatments
                                                </button>
                                                <h2 className="font-serif text-2xl sm:text-3xl text-primary font-medium tracking-tight mb-1">GUEST DETAILS</h2>
                                                <p className="text-xs text-text-muted">Enter your villa location and schedule for our therapists.</p>
                                            </div>

                                            <form className="space-y-4 pb-2" onSubmit={(e) => {
                                                e.preventDefault();
                                                if (!formData.name || !formData.date || !formData.time || !formData.location || !formData.whatsapp) {
                                                    alert('Please fill in all required fields (Name, Date, Time, Location, WhatsApp Number).');
                                                    return;
                                                }
                                                setTherapickStep('review');
                                            }}>
                                                <div className="space-y-1.5 w-full">
                                                    <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-primary/80 ml-1">
                                                        <User className="w-3.5 h-3.5"/> Guest Name
                                                    </label>
                                                    <input 
                                                        type="text" required placeholder="John Doe"
                                                        value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                        className="w-full bg-white border border-border/80 rounded-xl px-4 py-3.5 text-sm text-primary placeholder:text-text-muted/50 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                                    />
                                                </div>

                                                <div className="flex flex-row gap-4 w-full">
                                                    <div className="space-y-1.5 flex-1 min-w-0">
                                                        <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-primary/80 ml-1">
                                                            <Calendar className="w-3.5 h-3.5"/> Date
                                                        </label>
                                                        <input 
                                                            type="date" required 
                                                            value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })}
                                                            className="w-full min-w-0 appearance-none bg-white border border-border/80 rounded-xl px-4 py-3.5 text-sm text-primary placeholder:text-text-muted/50 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5 flex-1 min-w-0">
                                                        <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-primary/80 ml-1">
                                                            <Clock className="w-3.5 h-3.5"/> Time
                                                        </label>
                                                        <input 
                                                            type="time" required 
                                                            value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })}
                                                            className="w-full min-w-0 appearance-none bg-white border border-border/80 rounded-xl px-4 py-3.5 text-sm text-primary placeholder:text-text-muted/50 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-1.5 w-full">
                                                    <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-primary/80 ml-1">
                                                        <MapPin className="w-3.5 h-3.5"/> Villa / Hotel Name
                                                    </label>
                                                    <input 
                                                        type="text" required placeholder="e.g. Four Seasons Sayan"
                                                        value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })}
                                                        className="w-full bg-white border border-border/80 rounded-xl px-4 py-3.5 text-sm text-primary placeholder:text-text-muted/50 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                                    />
                                                </div>

                                                <div className="space-y-1.5 w-full">
                                                    <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-primary/80 ml-1">
                                                        <DoorOpen className="w-3.5 h-3.5"/> Room Number (Optional)
                                                    </label>
                                                    <input 
                                                        type="text" placeholder="e.g. Villa 12"
                                                        value={formData.room} onChange={e => setFormData({ ...formData, room: e.target.value })}
                                                        className="w-full bg-white border border-border/80 rounded-xl px-4 py-3.5 text-sm text-primary placeholder:text-text-muted/50 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                                    />
                                                </div>

                                                <div className="space-y-1.5 w-full">
                                                    <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-primary/80 ml-1">
                                                        <MessageCircle className="w-3.5 h-3.5"/> WhatsApp Number
                                                    </label>
                                                    <input 
                                                        type="tel" required placeholder="e.g. +62 812 3456 7890"
                                                        value={formData.whatsapp} onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                                                        className="w-full bg-white border border-border/80 rounded-xl px-4 py-3.5 text-sm text-primary placeholder:text-text-muted/50 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                                    />
                                                </div>

                                                <div className="pt-4 border-t border-border/50">
                                                    <div className="flex items-end justify-between mb-5">
                                                        <span className="text-xs font-bold text-primary uppercase tracking-widest">Total Price</span>
                                                        <span className="text-2xl font-serif text-primary font-medium">
                                                            IDR {calculateCartTotal(cartItems, appliedPromo, massageTableCount * 100000).total.toLocaleString('en-US')}
                                                        </span>
                                                    </div>
                                                    <button 
                                                        type="submit"
                                                        className="w-full bg-black hover:bg-neutral-800 text-white px-6 py-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:scale-[1.01] transition-all shadow-md uppercase tracking-widest"
                                                    >
                                                        <span>Review Booking</span>
                                                        <ArrowRight className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </form>
                                        </>
                                    )}

                                    {therapickStep === 'review' && (
                                        <>
                                            <div className="mb-5 pr-8 relative">
                                                <button
                                                    type="button"
                                                    onClick={() => setTherapickStep('details')}
                                                    className="inline-flex items-center gap-1 text-xs font-bold text-text-muted hover:text-primary uppercase tracking-wider mb-2"
                                                >
                                                    <ChevronLeft className="w-4 h-4" /> Edit Details
                                                </button>
                                                <h2 className="font-serif text-2xl sm:text-3xl text-primary font-medium tracking-tight mb-1">REVIEW BOOKING</h2>
                                                <p className="text-xs text-text-muted">Please verify your booking details below.</p>
                                            </div>

                                            <div className="space-y-4 pb-2">
                                                {/* Guest Details Summary */}
                                                <div className="bg-white border border-border/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
                                                    <h4 className="text-xs font-bold text-primary uppercase tracking-wider border-b border-border/40 pb-2">Guest Logistics</h4>
                                                    <div className="grid grid-cols-2 gap-3 text-xs">
                                                        <div>
                                                            <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">Guest Name</span>
                                                            <span className="font-medium text-primary">{formData.name}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">WhatsApp</span>
                                                            <span className="font-medium text-primary">{formData.whatsapp}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">Date & Time</span>
                                                            <span className="font-medium text-primary">{formData.date} at {formData.time}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">Villa / Location</span>
                                                            <span className="font-medium text-primary">{formData.location} {formData.room ? `(${formData.room})` : ''}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Setup Preference Summary */}
                                                <div className="bg-white border border-border/80 rounded-2xl p-4 shadow-xs flex items-center justify-between text-xs">
                                                    <div>
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">Massage Setup</span>
                                                        <span className="font-medium text-primary">
                                                            {massageTableCount > 0 
                                                                ? `${massageTableCount} Portable Table${massageTableCount > 1 ? 's' : ''} (+IDR ${(massageTableCount * 100000).toLocaleString('en-US')})` 
                                                                : 'Villa Bed / Floor Mat Setup (IDR 0)'
                                                            }
                                                        </span>
                                                    </div>
                                                    <button 
                                                        type="button" 
                                                        onClick={() => setTherapickStep('selection')}
                                                        className="text-[10px] font-bold uppercase tracking-wider text-text-muted hover:text-primary underline"
                                                    >
                                                        Change
                                                    </button>
                                                </div>

                                                {/* Treatments Summary */}
                                                <div className="bg-white border border-border/80 rounded-2xl p-4 shadow-xs space-y-2.5">
                                                    <div className="flex items-center justify-between border-b border-border/40 pb-2">
                                                        <h4 className="text-xs font-bold text-primary uppercase tracking-wider">Treatments ({cartItems.length})</h4>
                                                        <button 
                                                            type="button" 
                                                            onClick={() => setTherapickStep('selection')}
                                                            className="text-[10px] font-bold uppercase tracking-wider text-text-muted hover:text-primary underline"
                                                        >
                                                            Modify
                                                        </button>
                                                    </div>
                                                    {cartItems.map((item, idx) => {
                                                        const addonsTotal = (item.addons || []).reduce((s: number, a: any) => s + (Number(a.price) || 0), 0);
                                                        const isCouple = ['couple', 'honeymoon'].some(k => item.title.toLowerCase().includes(k));
                                                        const mult = isCouple ? (item.guests / 2) : item.guests;
                                                        const totalItem = (item.price + addonsTotal) * mult;
                                                        return (
                                                            <div key={idx} className="text-xs border-b border-border/20 last:border-b-0 pb-2">
                                                                <div className="flex items-center justify-between font-semibold text-primary">
                                                                    <span>{item.title}</span>
                                                                    <span>IDR {totalItem.toLocaleString('en-US')}</span>
                                                                </div>
                                                                <div className="text-[11px] text-text-muted flex items-center gap-2 mt-0.5">
                                                                    <span>{item.duration} Mins</span>
                                                                    <span>•</span>
                                                                    <span>{item.guests} Guest{item.guests > 1 ? 's' : ''}</span>
                                                                </div>
                                                                {item.addons && item.addons.length > 0 && (
                                                                    <div className="text-[10px] text-text-muted mt-1">
                                                                        Add-ons: {item.addons.map((a: any) => a.title).join(', ')}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                {/* Pricing Summary */}
                                                <div className="pt-3 border-t border-border/50">
                                                    {appliedPromo && (
                                                        <div className="flex items-center justify-between mb-2 text-xs">
                                                            <span className="text-text-muted uppercase tracking-widest font-bold">Subtotal</span>
                                                            <span className="font-serif text-text-muted line-through">
                                                                IDR {calculateCartTotal(cartItems).subtotal.toLocaleString('en-US')}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {massageTableCount > 0 && (
                                                        <div className="flex items-center justify-between mb-2 text-xs">
                                                            <span className="text-text-muted uppercase tracking-widest font-bold">Portable Table Fee ({massageTableCount}x)</span>
                                                            <span className="font-serif text-primary">
                                                                +IDR {(massageTableCount * 100000).toLocaleString('en-US')}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div className="flex items-end justify-between mb-5">
                                                        <span className="text-xs font-bold text-primary uppercase tracking-widest">Total Price</span>
                                                        <span className="text-2xl font-serif text-primary font-medium">
                                                            IDR {calculateCartTotal(cartItems, appliedPromo, massageTableCount * 100000).total.toLocaleString('en-US')}
                                                        </span>
                                                    </div>

                                                    <button 
                                                        type="button"
                                                        onClick={() => handleBooking()}
                                                        disabled={isProcessing}
                                                        className="w-full bg-black hover:bg-neutral-800 text-white px-6 py-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:scale-[1.01] transition-all duration-200 shadow-[0_8px_24px_rgb(0,0,0,0.15)] uppercase tracking-widest disabled:opacity-70"
                                                    >
                                                        <MessageCircle className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                                                        <span>{isProcessing ? 'PROCESSING...' : 'CONFIRM ON WHATSAPP'}</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ) : (
                                /* =================== ORIGINAL FLOW FOR OTHER 2 DOMAINS (UBUD & BALI) =================== */
                                <div className="animate-in fade-in slide-in-from-left-4 duration-300 flex flex-col max-h-[85vh] sm:max-h-[70vh] overflow-y-auto overflow-x-hidden no-scrollbar pb-4 pr-1">
                                    <div className="mb-5 pr-8 relative">
                                        <h2 className="font-serif text-2xl sm:text-3xl text-primary font-medium tracking-tight mb-1">{isReviewingBooking ? 'REVIEW BOOKING' : 'COMPLETE BOOKING'}</h2>
                                        <p className="text-xs text-text-muted">{isReviewingBooking ? 'Please verify your details below.' : 'Your request will be sent securely via WhatsApp.'}</p>
                                    </div>

                                    {/* Cart Items List */}
                                    <div className="space-y-3 mb-5">
                                        {cartItems.map(item => (
                                            <div key={item.id} className="bg-white border border-border/80 rounded-2xl p-4 sm:p-5 shadow-sm relative">
                                                <div className="flex items-start justify-between mb-4 pr-6">
                                                    <div>
                                                        <h3 className="font-bold text-sm text-primary leading-tight">{item.title}</h3>
                                                        <p className="text-xs text-text-muted flex items-center gap-1 mt-1 mb-2">
                                                            <Clock className="w-3 h-3" /> {item.duration} Mins
                                                        </p>
                                                        {isReviewingBooking && (() => {
                                                            const itemTreatment = treatments.find(t => t.id === item.treatmentId || t.title === item.title) || treatment;
                                                            if (!itemTreatment || !itemTreatment.desc) return null;
                                                            return (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setDetailsModalTreatment(itemTreatment)}
                                                                    className="mt-2 mb-3 text-[10px] font-bold uppercase tracking-widest text-primary underline underline-offset-4 decoration-primary/30 hover:decoration-primary transition-all flex items-center gap-1"
                                                                >
                                                                    See Details <ArrowRight className="w-3 h-3" />
                                                                </button>
                                                            );
                                                        })()}
                                                    </div>
                                                    <span className="font-serif text-primary font-medium text-right flex flex-col shrink-0">
                                                        IDR {item.price.toLocaleString('en-US')}
                                                        <span className="text-[10px] font-sans text-text-muted font-normal uppercase tracking-wider">
                                                            {['couple', 'honeymoon'].some(k => item.title.toLowerCase().includes(k)) ? 'For 2 Persons' : 'Per Person'}
                                                        </span>
                                                    </span>
                                                </div>

                                                <div className="flex items-center justify-between pt-3 border-t border-border/50">
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary/80">Guests</span>
                                                    <div className="flex items-center gap-3">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const newCart = cartItems.filter(i => i.id !== item.id);
                                                                setCartItems(newCart);
                                                                if (newCart.length === 0) {
                                                                    setIsModalOpen(false);
                                                                    setIsReviewingBooking(false);
                                                                }
                                                            }}
                                                            className="w-8 h-8 rounded-full bg-white border border-border flex items-center justify-center text-text-muted hover:text-red-500 hover:border-red-200 transition-colors shadow-sm"
                                                            title="Remove treatment"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                        <div className="w-px h-5 bg-border mx-1"></div>
                                                        <button
                                                            type="button"
                                                            onClick={() => setCartItems(cartItems.map(i => {
                                                                if (i.id !== item.id) return i;
                                                                const isCouple = ['couple', 'honeymoon'].some(k => i.title.toLowerCase().includes(k));
                                                                const step = isCouple ? 2 : 1;
                                                                return { ...i, guests: Math.max(step, i.guests - step) };
                                                            }))}
                                                            className="w-8 h-8 rounded-full bg-white border border-border flex items-center justify-center text-primary hover:bg-border transition-colors shadow-sm"
                                                        >
                                                            <Minus className="w-3 h-3" />
                                                        </button>
                                                        <span className="font-bold text-sm text-primary w-4 text-center">{item.guests}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => setCartItems(cartItems.map(i => {
                                                                if (i.id !== item.id) return i;
                                                                const isCouple = ['couple', 'honeymoon'].some(k => i.title.toLowerCase().includes(k));
                                                                const step = isCouple ? 2 : 1;
                                                                return { ...i, guests: i.guests + step };
                                                            }))}
                                                            className="w-8 h-8 rounded-full bg-white border border-border flex items-center justify-center text-primary hover:bg-border transition-colors shadow-sm"
                                                        >
                                                            <Plus className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setIsSelectingMore(true)}
                                        className="w-full bg-white text-primary border border-border/80 px-6 py-3.5 rounded-xl text-xs font-bold shadow-sm hover:bg-white transition-colors mb-6 tracking-widest uppercase"
                                    >
                                        + Add Another Treatment
                                    </button>

                                    {!isReviewingBooking ? (
                                    <form className="space-y-5 pb-8 sm:pb-0" onSubmit={(e) => {
                                        e.preventDefault();
                                        if (!formData.name || !formData.date || !formData.time || !formData.location) {
                                            alert('Please fill in all required fields (Name, Date, Time, Location).');
                                            return;
                                        }
                                        setIsReviewingBooking(true);
                                    }}>
                                        <div className="space-y-1.5 w-full">
                                            <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-primary/80 ml-1"><User className="w-3.5 h-3.5"/> Guest Name</label>
                                            <input
                                                type="text" required placeholder="John Doe"
                                                value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full bg-white border border-border/80 rounded-xl px-4 py-3.5 text-sm text-primary placeholder:text-text-muted/50 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                            />
                                        </div>
                                        <div className="flex flex-row gap-4 w-full">
                                            <div className="space-y-1.5 flex-1 min-w-0">
                                                <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-primary/80 ml-1"><Calendar className="w-3.5 h-3.5"/> Date</label>
                                                <input
                                                    type="date" required
                                                    value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })}
                                                    className="w-full min-w-0 appearance-none bg-white border border-border/80 rounded-xl px-4 py-3.5 text-sm text-primary placeholder:text-text-muted/50 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                                />
                                            </div>
                                            <div className="space-y-1.5 flex-1 min-w-0">
                                                <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-primary/80 ml-1"><Clock className="w-3.5 h-3.5"/> Time</label>
                                                <input
                                                    type="time" required
                                                    value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })}
                                                    className="w-full min-w-0 appearance-none bg-white border border-border/80 rounded-xl px-4 py-3.5 text-sm text-primary placeholder:text-text-muted/50 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5 w-full">
                                            <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-primary/80 ml-1"><MapPin className="w-3.5 h-3.5"/> Villa / Hotel Name</label>
                                            <input
                                                type="text" required placeholder="e.g. Four Seasons Sayan"
                                                value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })}
                                                className="w-full bg-white border border-border/80 rounded-xl px-4 py-3.5 text-sm text-primary placeholder:text-text-muted/50 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                            />
                                        </div>
                                        <div className="space-y-1.5 w-full">
                                            <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-primary/80 ml-1"><DoorOpen className="w-3.5 h-3.5"/> Room Number (Optional)</label>
                                            <input
                                                type="text" placeholder="e.g. Villa 12"
                                                value={formData.room} onChange={e => setFormData({ ...formData, room: e.target.value })}
                                                className="w-full bg-white border border-border/80 rounded-xl px-4 py-3.5 text-sm text-primary placeholder:text-text-muted/50 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                            />
                                        </div>

                                        {/* Promo Code Input */}
                                        <div className="space-y-1.5 pt-1 w-full">
                                            <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-primary/80 ml-1"><Tag className="w-3.5 h-3.5"/> Promo Code (Optional)</label>
                                            <div className="flex gap-2 w-full">
                                                <input
                                                    type="text" placeholder="Enter code"
                                                    value={promoCodeInput} onChange={e => setPromoCodeInput(e.target.value.toUpperCase())}
                                                    disabled={!!appliedPromo || isPromoLoading}
                                                    className="w-full bg-white border border-border/80 rounded-xl px-4 py-3 text-sm text-primary placeholder:text-text-muted/50 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all uppercase"
                                                />
                                                {appliedPromo ? (
                                                    <button type="button" onClick={handleRemovePromo} className="px-5 bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors uppercase tracking-wider whitespace-nowrap">
                                                        Remove
                                                    </button>
                                                ) : (
                                                    <button type="button" onClick={handleApplyPromo} disabled={!promoCodeInput.trim() || isPromoLoading} className="px-5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider whitespace-nowrap">
                                                        {isPromoLoading ? 'Applying...' : 'Apply'}
                                                    </button>
                                                )}
                                            </div>
                                            {promoError && <p className="text-xs text-red-500 ml-1">{promoError}</p>}
                                            {promoSuccess && <p className="text-xs text-emerald-600 ml-1">{promoSuccess}</p>}
                                        </div>

                                        <div className="mt-8 pt-6 border-t border-border/50">
                                            <div className="flex items-end justify-between mb-6">
                                                <span className="text-xs font-bold text-text-muted uppercase tracking-widest">Total Price</span>
                                                <span className="text-2xl font-serif text-primary">
                                                    IDR {calculateCartTotal(cartItems, appliedPromo).total.toLocaleString('en-US')}
                                                </span>
                                            </div>
                                            <div className="flex flex-col gap-3">
                                                <button
                                                    type="submit"
                                                    className="w-full bg-primary text-white px-6 py-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary/90 hover:scale-[1.02] transition-all duration-300 shadow-[0_8px_24px_rgb(0,0,0,0.15)] uppercase tracking-widest"
                                                >
                                                    REVIEW BOOKING
                                                </button>
                                            </div>
                                        </div>
                                    </form>
                                    ) : (
                                    <div className="space-y-5 pb-8 sm:pb-0 animate-in fade-in slide-in-from-right-4 duration-300">
                                        <div className="bg-white border border-border/80 rounded-xl p-5 space-y-4">
                                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-primary/80 border-b border-border/50 pb-2 mb-2">Guest Details</h3>
                                            <div className="grid grid-cols-3 gap-3 sm:gap-5 items-center">
                                                <div className="flex flex-col gap-5">
                                                    <div>
                                                        <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-text-muted mb-1"><User className="w-3 h-3"/> Name</span>
                                                        <span className="text-sm text-primary font-medium">{formData.name}</span>
                                                    </div>
                                                    <div>
                                                        <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-text-muted mb-1"><Calendar className="w-3 h-3"/> Date</span>
                                                        <span className="text-sm text-primary font-medium">{formData.date}</span>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex flex-col items-center justify-center text-center border-x border-border/50 px-2 h-full py-2">
                                                    <span className="flex items-center justify-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-text-muted mb-2"><Clock className="w-3 h-3"/> Time</span>
                                                    <span className="text-xl sm:text-2xl text-primary font-serif font-medium">{formData.time}</span>
                                                </div>

                                                <div className="flex flex-col gap-5">
                                                    <div>
                                                        <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-text-muted mb-1"><MapPin className="w-3 h-3"/> Location</span>
                                                        <span className="text-sm text-primary font-medium line-clamp-2 leading-tight">{formData.location}</span>
                                                    </div>
                                                    {formData.room && (
                                                        <div>
                                                            <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-text-muted mb-1"><DoorOpen className="w-3 h-3"/> Room</span>
                                                            <span className="text-sm text-primary font-medium line-clamp-1">{formData.room}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-8 pt-6 border-t border-border/50">
                                            <div className="flex items-end justify-between mb-6">
                                                <span className="text-xs font-bold text-text-muted uppercase tracking-widest">Total Price</span>
                                                <span className="text-2xl font-serif text-primary">
                                                    IDR {calculateCartTotal(cartItems, appliedPromo).total.toLocaleString('en-US')}
                                                </span>
                                            </div>
                                            <div className="flex flex-col gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => handleBooking()}
                                                    disabled={isProcessing}
                                                    className="w-full bg-primary text-white px-6 py-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary/90 hover:scale-[1.02] transition-all duration-300 shadow-[0_8px_24px_rgb(0,0,0,0.15)] uppercase tracking-widest disabled:opacity-70"
                                                >
                                                    {isProcessing ? 'PROCESSING...' : 'CONFIRM ON WHATSAPP'}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setIsReviewingBooking(false)}
                                                    className="w-full bg-transparent text-text-muted hover:text-primary py-2 text-xs font-bold tracking-widest uppercase transition-colors"
                                                >
                                                    Back to Edit
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Treatment Details Modal */}
            <AnimatePresence>
                {detailsModalTreatment && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6"
                    >
                        <motion.div
                            initial={{ y: '100%', opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: '100%', opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="bg-white w-full max-w-2xl max-h-[90vh] rounded-[2rem] overflow-hidden flex flex-col shadow-2xl"
                        >
                            <div className="p-6 border-b border-border/50 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur z-10">
                                <h3 className="font-serif text-2xl text-primary">{detailsModalTreatment.title}</h3>
                                <button
                                    onClick={() => setDetailsModalTreatment(null)}
                                    className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5 text-primary" />
                                </button>
                            </div>
                            <div className="p-6 overflow-y-auto no-scrollbar">
                                {(() => {
                                    let whatsIncluded = '';
                                    let desc = detailsModalTreatment.desc;
                                    if (desc) {
                                        const parts = desc.split(/What's Included\s*:?\s*/i);
                                        if (parts.length > 1) {
                                            desc = parts[0].trim();
                                            whatsIncluded = parts[1].trim();
                                        }
                                    }
                                    return (
                                        <div className="space-y-8">
                                            {desc && (
                                                <div className="space-y-3">
                                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary/80">Description</h4>
                                                    <p className="text-sm text-text-muted leading-relaxed">{desc}</p>
                                                </div>
                                            )}
                                            {whatsIncluded && (
                                                <div className="space-y-4">
                                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary/80">What's Included</h4>
                                                    <div className="border border-border/80 rounded-2xl overflow-hidden">
                                                        <table className="w-full text-left border-collapse">
                                                            <thead>
                                                                <tr className="bg-white border-b border-border/80">
                                                                    <th className="py-3 px-4 text-[9px] font-bold uppercase tracking-widest text-primary/70">Treatment</th>
                                                                    <th className="py-3 px-4 text-[9px] font-bold uppercase tracking-widest text-primary/70 w-1/3">Duration</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-border/50">
                                                                {whatsIncluded.split('\n').filter(Boolean).map((line, i) => {
                                                                    const cleanLine = line.replace(/^-\s*/, '').trim();
                                                                    const durationMatch = cleanLine.match(/^(\d+\s*-\s*[Mm]inutes?)\s+(.*)/i) || cleanLine.match(/^(.*)\s+\((\d+\s*[Mm]inutes?)\)$/i);
                                                                    
                                                                    let treatmentName = cleanLine;
                                                                    let durationStr = '-';
                                                                    
                                                                    if (durationMatch) {
                                                                        if (cleanLine.match(/^(\d+\s*-\s*[Mm]inutes?)\s+(.*)/i)) {
                                                                            durationStr = durationMatch[1].replace('-', '').trim();
                                                                            treatmentName = durationMatch[2].trim();
                                                                        } else {
                                                                            treatmentName = durationMatch[1].trim();
                                                                            durationStr = durationMatch[2].trim();
                                                                        }
                                                                    }

                                                                    return (
                                                                        <tr key={i} className="hover:bg-white/50 transition-colors">
                                                                            <td className="py-3 px-4 text-xs font-medium text-primary">{treatmentName}</td>
                                                                            <td className="py-3 px-4 text-xs text-text-muted flex items-center gap-1.5">
                                                                                {durationStr !== '-' && <Clock className="w-3 h-3 opacity-50" />}
                                                                                {durationStr}
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>


        </div>
    );
}
