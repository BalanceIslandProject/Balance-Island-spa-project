'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Share, MapPin, Clock, Calendar, Sparkles, Plus, Minus, X, MessageCircle, Heart, Bitcoin, ArrowRight, User, Tag, DoorOpen, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useSpa } from '@/context/SpaContext';
import { supabase } from '@/lib/supabase';
import { createSlug } from '@/utils/slugify';

export default function RitualsDetails() {
    const params = useParams();
    const id = params?.id as string;
    const { treatments, siteBrandFilter } = useSpa();
    const treatment = treatments.find(t => t.id === id || createSlug(t.title) === id);

    const [selectedOptionIdx, setSelectedOptionIdx] = useState(0);
    const [cartItems, setCartItems] = useState<{
        id: string;
        treatmentId: string;
        title: string;
        duration: string;
        price: number;
        guests: number;
    }[]>([]);
    const [isSelectingMore, setIsSelectingMore] = useState(false);
    const [expandedTreatmentId, setExpandedTreatmentId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isReviewingBooking, setIsReviewingBooking] = useState(false);
    const [detailsModalTreatment, setDetailsModalTreatment] = useState<any>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    
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
    
    const [formData, setFormData] = useState({ name: '', location: '', room: '', ...getInitialDateTime() });

    if (!treatment) {
        return <div className="min-h-screen bg-background flex items-center justify-center font-serif text-2xl text-primary">Loading...</div>;
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

    const handleBooking = async (e: React.FormEvent, ) => {
        e.preventDefault();
        
        if (!formData.name || !formData.date || !formData.time || !formData.location) {
            alert('Please fill in all required fields (Name, Date, Time, Location).');
            return;
        }

        // Apply promo usages
        if (appliedPromo) {
            try {
                await supabase.rpc('increment_promo_use', { promo_id: appliedPromo.id });
            } catch (e) {
                console.error('Failed to increment promo use', e);
            }
        }

        // Open window synchronously to bypass popup blockers
        const newWindow = window.open('', '_blank');

        setIsProcessing(true);

        try {
            const treatmentsListStr = cartItems.map(item => `${item.title} (${item.duration} MINS)`).join(', ');

            const waNumber = '6285174119423';
            const treatmentsList = cartItems.map(item => {
                const isCouple = ['couple', 'honeymoon'].some(k => item.title.toLowerCase().includes(k));
                const multiplier = isCouple ? (item.guests / 2) : item.guests;
                const price = (item.price * multiplier).toLocaleString('en-US');
                const itemTreatment = treatments.find(t => t.id === item.treatmentId);
                
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
            
            const rawHost = typeof window !== 'undefined' ? window.location.hostname : 'elexoirhomespaubud.com';
            const cleanHost = rawHost.replace(/^https?:\/\//, '').replace(/\/$/, '');
            const websiteSource = cleanHost.startsWith('www.') ? cleanHost : `www.${cleanHost}`;
            
            let promoDetailsText = '';
            if (appliedPromo) {
                promoDetailsText = `\n\n*PROMO APPLIED:*\n• Code: ${appliedPromo.code}\n• Discount: ${appliedPromo.discount_type === 'percentage' ? appliedPromo.discount_value + '%' : 'IDR ' + appliedPromo.discount_value.toLocaleString('en-US')}\n• Subtotal: IDR ${subtotalPrice.toLocaleString('en-US')}`;
            }

            const baseMessage = `*NEW SPA BOOKING*\n${websiteSource}\n\n*TREATMENTS:*\n${treatmentsList}\n\n*TOTAL PRICE:* IDR ${formattedTotalPrice}${promoDetailsText}\n\n*CLIENT DETAILS:*\n- Name: ${formData.name}\n- Date: ${formData.date}\n- Time: ${formData.time}\n- Location/Villa: ${formData.location}\n- Room Number: ${formData.room || 'N/A'}\n\nHello! I would like to confirm this booking.`;
            
            const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(baseMessage)}`;
            if (newWindow) {
                newWindow.location.href = waUrl;
            } else {
                window.location.href = waUrl;
            }
            
            setIsModalOpen(false);
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
        setIsModalOpen(true);
    };



    const handleShare = async () => {
        const shareData = {
            title: `${treatment.title} - Elexoir Home Spa`,
            text: `Book the ${treatment.title} at Elexoir Home Spa Ubud!`,
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                    
                    {/* Selectable Durations */}
                    <div className="bg-white/40 border border-highlight rounded-[32px] p-6 flex flex-col justify-between">
                        <div className="flex items-start justify-between mb-6">
                            <span className="text-sm font-bold uppercase tracking-widest text-primary/80">Select Duration</span>
                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-primary shadow-sm">
                                <Clock className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {treatment.options.map((opt, idx) => {
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
                <div className="mb-14 bg-white/50 backdrop-blur-xl border border-white/60 p-6 md:p-8 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
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
                </div>

                {/* Related (Dynamic from Supabase) */}
                {relatedTreatments.length > 0 && (
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-primary">Related Treatments</h3>
                        <Link href="/" className="text-xs font-bold text-text-muted hover:text-primary transition-colors">VIEW ALL</Link>
                    </div>
                    
                    <div className="flex overflow-x-auto pb-6 -mx-6 px-6 md:mx-0 md:px-0 gap-4 no-scrollbar">
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
                </div>
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
                                onClick={() => setIsModalOpen(false)}
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
                                                            className="border-t border-border/50 bg-[#FDFBF7]"
                                                        >
                                                            <div className="p-4 space-y-4">
                                                                <p className="text-xs text-text-muted leading-relaxed">{t.desc}</p>
                                                                <div className="space-y-2">
                                                                    <div className="text-[10px] font-bold uppercase tracking-widest text-primary/80 mb-2">Select Duration</div>
                                                                    {t.options.map((opt, idx) => (
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
                            ) : (
                                <div className="animate-in fade-in slide-in-from-left-4 duration-300 relative">
                                    
                                    <h2 className="font-serif text-2xl text-primary mb-1 pr-8">{isReviewingBooking ? 'REVIEW BOOKING' : 'COMPLETE BOOKING'}</h2>
                                    <p className="text-xs text-text-muted mb-6">{isReviewingBooking ? 'Please verify your details below.' : 'Your request will be sent securely via WhatsApp.'}</p>

                                    {/* Cart Items List */}
                                    <div className="space-y-3 mb-4">
                                        {cartItems.map(item => (
                                            <div key={item.id} className="bg-white border border-border/80 rounded-2xl p-4 sm:p-5 shadow-sm relative">
                                                
                                                <div className="flex items-start justify-between mb-4 pr-6">
                                                    <div>
                                                        <h3 className="font-bold text-sm text-primary leading-tight">{item.title}</h3>
                                                        <p className="text-xs text-text-muted flex items-center gap-1 mt-1 mb-2">
                                                            <Clock className="w-3 h-3" /> {item.duration} Mins
                                                        </p>
                                                        {isReviewingBooking && (() => {
                                                            const itemTreatment = treatments.find(t => t.id === item.treatmentId || t.title === item.title);
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
                                                        <span className="text-[9px] font-sans text-text-muted font-normal uppercase tracking-wider">
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
                                        + ADD ANOTHER TREATMENT
                                    </button>

                                    {!isReviewingBooking ? (
                            <form className="space-y-5 pb-8 md:pb-0">
                                <div className="space-y-1.5 w-full">
                                    <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-primary/80 ml-1"><User className="w-3.5 h-3.5"/> Guest Name</label>
                                    <input 
                                        type="text" required placeholder="John Doe"
                                        value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                                        className="w-full bg-white border border-border/80 rounded-xl px-4 py-3.5 text-sm text-primary placeholder:text-text-muted/50 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                    />
                                </div>
                                <div className="flex flex-row gap-4 w-full">
                                    <div className="space-y-1.5 flex-1 min-w-0">
                                        <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-primary/80 ml-1"><Calendar className="w-3.5 h-3.5"/> Date</label>
                                        <input 
                                            type="date" required 
                                            value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})}
                                            className="w-full min-w-0 appearance-none bg-white border border-border/80 rounded-xl px-4 py-3.5 text-sm text-primary placeholder:text-text-muted/50 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1.5 flex-1 min-w-0">
                                        <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-primary/80 ml-1"><Clock className="w-3.5 h-3.5"/> Time</label>
                                        <input 
                                            type="time" required 
                                            value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})}
                                            className="w-full min-w-0 appearance-none bg-white border border-border/80 rounded-xl px-4 py-3.5 text-sm text-primary placeholder:text-text-muted/50 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-primary/80 ml-1"><MapPin className="w-3.5 h-3.5"/> Villa / Hotel Name</label>
                                    <input 
                                        type="text" required placeholder="e.g. Four Seasons Sayan"
                                        value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})}
                                        className="w-full bg-white border border-border/80 rounded-xl px-4 py-3.5 text-sm text-primary placeholder:text-text-muted/50 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-primary/80 ml-1"><DoorOpen className="w-3.5 h-3.5"/> Room Number (Optional)</label>
                                    <input 
                                        type="text" placeholder="e.g. Villa 12"
                                        value={formData.room} onChange={e => setFormData({...formData, room: e.target.value})}
                                        className="w-full bg-white border border-border/80 rounded-xl px-4 py-3.5 text-sm text-primary placeholder:text-text-muted/50 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                    />
                                </div>

                                <div className="space-y-1.5 pt-2 w-full">
                                    <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-primary/80 ml-1"><Tag className="w-3.5 h-3.5"/> Promo Code</label>
                                    <div className="flex gap-2 w-full">
                                        <input 
                                            type="text" placeholder="Enter code"
                                            value={promoCodeInput} onChange={e => setPromoCodeInput(e.target.value.toUpperCase())}
                                            disabled={!!appliedPromo || isPromoLoading}
                                            className="w-full bg-white border border-border/80 rounded-xl px-4 py-3.5 text-sm text-primary placeholder:text-text-muted/50 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all uppercase"
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
                                    {appliedPromo && (
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-bold text-text-muted uppercase tracking-widest">Subtotal</span>
                                            <span className="text-sm font-serif text-text-muted line-through">
                                                IDR {subtotalPrice.toLocaleString('en-US')}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex items-end justify-between mb-6">
                                        <span className="text-xs font-bold text-text-muted uppercase tracking-widest">Total Price</span>
                                        <span className="text-2xl font-serif text-primary">IDR {formattedTotalPrice}</span>
                                    </div>
                                    <div className="flex flex-col gap-3">
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                if (!formData.name || !formData.date || !formData.time || !formData.location) {
                                                    alert('Please fill in all required fields (Name, Date, Time, Location).');
                                                    return;
                                                }
                                                setIsReviewingBooking(true);
                                            }}
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
                                            <div className="grid grid-cols-2 gap-5">
                                                    <div>
                                                        <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-text-muted mb-1"><User className="w-3 h-3"/> Name</span>
                                                        <span className="text-sm text-primary font-medium">{formData.name}</span>
                                                    </div>
                                                    <div>
                                                        <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-text-muted mb-1"><Calendar className="w-3 h-3"/> Date</span>
                                                        <span className="text-sm text-primary font-medium">{formData.date}</span>
                                                    </div>
                                                    <div>
                                                        <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-text-muted mb-1"><Clock className="w-3 h-3"/> Time</span>
                                                        <span className="text-sm text-primary font-medium">{formData.time}</span>
                                                    </div>
                                                    <div>
                                                        <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-text-muted mb-1"><MapPin className="w-3 h-3"/> Location</span>
                                                        <span className="text-sm text-primary font-medium line-clamp-1">{formData.location}</span>
                                                    </div>
                                                    {formData.room && (
                                                        <div className="col-span-2 pt-1 mt-1">
                                                            <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-text-muted mb-1"><DoorOpen className="w-3 h-3"/> Room Number</span>
                                                            <span className="text-sm text-primary font-medium">{formData.room}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            <div className="mt-8 pt-6 border-t border-border/50">
                                            <div className="flex flex-col gap-3">
                                                <button
                                                    type="button"
                                                    onClick={(e) => handleBooking(e)}
                                                    disabled={isProcessing}
                                                    className="w-full bg-primary text-white px-6 py-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary/90 hover:scale-[1.02] transition-all duration-300 shadow-[0_8px_24px_rgb(0,0,0,0.15)] uppercase tracking-widest disabled:opacity-70"
                                                >
                                                    {isProcessing ? 'PROCESSING...' : 'CONFIRM ON WHATSAPP'}
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
