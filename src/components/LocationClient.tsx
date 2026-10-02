'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Search, Heart, Cloud, Sparkles, Droplet, User, Flame, Clock, ArrowRight, X, ShoppingBag, Plus, Minus, MessageCircle, ChevronLeft, Bitcoin, CheckCircle2, Copy, Calendar, MapPin, Tag, DoorOpen, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { saveBookingToSupabase } from '@/lib/bookingUtils';
import { useCart } from '@/context/CartContext';
import { useSpa } from '@/context/SpaContext';
import SeoExpandedContent from '@/components/SeoExpandedContent';
import WhyChooseUs from '@/components/WhyChooseUs';
import ServiceAreas from '@/components/ServiceAreas';
import FaqSection from '@/components/FaqSection';
import { createSlug } from '@/utils/slugify';

// Dummy data for redesign structure
const CATEGORIES = [
    { id: 'all', label: 'All' },
    { id: 'massage', label: 'Massage' },
    { id: 'package', label: 'Package' },
    { id: 'facial', label: 'Facial' },
    { id: 'treatment', label: 'Treatment' },
];


export default function LocationClient({ locationName, locationSlug }: { locationName: string, locationSlug: string }) {
    const { saveDraft, confirmBooking } = useCart();
    const bookingIdRef = React.useRef<string>(Math.random().toString(36).substring(2, 8).toUpperCase());

    const { treatments, campaign, products, isLoaded } = useSpa();

    const [activeCategory, setActiveCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [maxPrice, setMaxPrice] = useState(1500000); // default max price
    const [isPriceFilterOpen, setIsPriceFilterOpen] = useState(false);
    const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    
    const scrollLeft = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: -350, behavior: 'smooth' });
        }
    };
    
    const scrollRight = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: 350, behavior: 'smooth' });
        }
    };
    
    // Booking Form State for Campaign
    const [cartItems, setCartItems] = useState<any[]>([]);
    const [isSelectingMore, setIsSelectingMore] = useState(false);
    const [expandedTreatmentId, setExpandedTreatmentId] = useState<string | null>(null);
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [isReviewingBooking, setIsReviewingBooking] = useState(false);
    const [detailsModalTreatment, setDetailsModalTreatment] = useState<any>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    
    // Initialize date and time
    const getInitialDateTime = () => {
        const now = new Date();
        const date = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
        const time = now.toTimeString().split(' ')[0].substring(0, 5);
        return { date, time };
    };
    
    const [formData, setFormData] = useState({ name: '', location: '', room: '', ...getInitialDateTime() });

    const filteredAndSortedTreatments = React.useMemo(() => {
        let result = treatments.filter(t => {
            const matchesCategory = activeCategory === 'all' || t.category.toLowerCase() === activeCategory.toLowerCase();
            const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || t.desc.toLowerCase().includes(searchQuery.toLowerCase());
            
            const getLowestPrice = (options: any[]) => {
                if (!options || options.length === 0) return 0;
                return Math.min(...options.map(o => parseInt(o.price.replace(/,/g, '') || '0')));
            };
            
            const matchesPrice = getLowestPrice(t.options) <= maxPrice;
            
            return matchesCategory && matchesSearch && matchesPrice;
        });

        // Always sort from lowest to highest naturally
        result.sort((a, b) => {
            const getLowestPrice = (options: any[]) => {
                if (!options || options.length === 0) return 0;
                return Math.min(...options.map(o => parseInt(o.price.replace(/,/g, '') || '0')));
            };
            return getLowestPrice(a.options) - getLowestPrice(b.options);
        });

        return result;
    }, [treatments, activeCategory, searchQuery, maxPrice]);

    const handleCampaignBooking = async (e: React.FormEvent, ) => {
        e.preventDefault();
        
        if (!formData.name || !formData.date || !formData.time || !formData.location) {
            alert('Please fill in all required fields (Name, Date, Time, Location).');
            return;
        }

        const newWindow = window.open('', '_blank');
        setIsProcessing(true);
        
        try {
            const totalPrice = cartItems.reduce((acc, item) => acc + (item.price * item.guests), 0);
            
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

                if (item.isCampaign && item.discountPercentage && Number(item.discountPercentage) > 0) {
                    const originalPriceNum = item.price / (1 - (item.discountPercentage / 100));
                    const originalPrice = (originalPriceNum * multiplier).toLocaleString('en-US');
                    const priceText = `~IDR ${originalPrice}~ [${item.discountPercentage}% OFF SPA]`;
                    return `*${item.title.toUpperCase()}*\nDURATION ${item.duration} MINS\n${guestAndPriceText} ${priceText}${whatsIncludedText}`;
                }

                return `*${item.title.toUpperCase()}*\nDURATION ${item.duration} MINS\n${guestAndPriceText}${whatsIncludedText}`;
            }).join('\n\n------------------------\n\n');
            
            const campaignItems = cartItems.filter(item => item.isCampaign);
            let campaignDetailsText = '';
            if (campaignItems.length > 0) {
                const uniqueCampaigns = Array.from(new Set(campaignItems.map(i => i.campaignTitle).filter(Boolean)));
                const uniqueTripOffers = Array.from(new Set(campaignItems.map(i => i.tripOffer).filter(Boolean)));
                
                const lines: string[] = [];
                if (uniqueCampaigns.length > 0) {
                    lines.push(`*CAMPAIGN:* ${uniqueCampaigns.join(', ').toUpperCase()}`);
                }
                if (uniqueTripOffers.length > 0) {
                    lines.push(`*TRAVEL BENEFIT:* ${uniqueTripOffers.join(', ')}`);
                }
                if (lines.length > 0) {
                    campaignDetailsText = `\n\n${lines.join('\n')}`;
                }
            }

            const rawHost = typeof window !== 'undefined' ? window.location.hostname : 'elexoirhomespaubud.com';
            const cleanHost = rawHost.replace(/^https?:\/\//, '').replace(/\/$/, '');
            const websiteSource = cleanHost.startsWith('www.') ? cleanHost : `www.${cleanHost}`;

            const baseMessage = `*NEW SPA BOOKING*\n${websiteSource}\n\n*TREATMENTS:*\n${treatmentsList}\n\n*TOTAL PRICE:* IDR ${totalPrice.toLocaleString('en-US')}\n\n*CLIENT DETAILS:*\n• Name: ${formData.name}\n• Date: ${formData.date}\n• Time: ${formData.time}\n• Location/Villa: ${formData.location}\n• Room Number: ${formData.room || 'N/A'}${campaignDetailsText}\n\nHello! I would like to confirm this booking.`;
            
            
            
            
            const minInvoice = {
                id: bookingIdRef.current,
                date: new Date().toISOString(),
                status: 'confirmed',
                items: cartItems.map(i => ({ title: i.title, duration: i.duration, guests: i.guests, price: i.price })),
                customerDetails: { name: formData.name, date: formData.date, time: formData.time, location: formData.location, room: formData.room || '' },
                totalPrice: typeof totalPrice !== 'undefined' ? totalPrice : cartItems.reduce((sum, item) => sum + (item.price * item.guests), 0)
            };
            const invoiceUrl = window.location.origin + '/invoice/' + bookingIdRef.current;
    
    
            const finalMessage = baseMessage + '\n\n*BOOKING ID :* ' + bookingIdRef.current;
            
            saveDraft({
                id: bookingIdRef.current,
                date: new Date().toISOString(),
                status: 'confirmed',
                items: cartItems,
                customerDetails: formData,
                totalPrice: typeof totalPrice !== 'undefined' ? totalPrice : cartItems.reduce((sum, item) => sum + (item.price * item.guests), 0)
            });

            // Save to Supabase
            await saveBookingToSupabase(
                bookingIdRef.current,
                formData,
                cartItems,
                typeof totalPrice !== 'undefined' ? totalPrice : cartItems.reduce((sum, item) => sum + (item.price * item.guests), 0),
                'elexoir' // Or we can use siteBrandFilter if available, but for location it is elexoir
            );
    
            const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(finalMessage)}`;
            if (newWindow) {
                newWindow.location.href = waUrl;
            } else {
                window.location.href = waUrl;
            }
            
            setCartItems([]);
            setIsBookingModalOpen(false);
        } catch (error) {
            console.error(error);
            if (newWindow) newWindow.close();
            alert('An error occurred while processing the booking.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <>
            {isLoaded && (
                <div className="min-h-screen bg-[#FDFBF7] relative overflow-hidden font-sans text-text pb-24 md:pb-12">
            
            {/* Top Gradient Background */}
            <div className="absolute top-0 left-0 right-0 h-[400px] md:h-[500px] bg-gradient-to-b from-white to-white z-0 pointer-events-none"></div>

            {/* Luxurious Ambient Background */}
            <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[120%] md:w-[800px] h-[600px] bg-secondary/30 blur-[120px] rounded-full z-0 pointer-events-none opacity-60 mix-blend-multiply" />
            <div className="absolute top-[10%] right-[-10%] w-[500px] h-[500px] bg-accent/20 blur-[100px] rounded-full z-0 pointer-events-none opacity-50" />

            <div className="relative z-10 max-w-7xl mx-auto px-6 pt-24 md:pt-36">
                
                {/* Slogan */}
                <div className="md:hidden mt-4 mb-6 px-2">
                    <h1 className="font-serif text-3xl text-primary font-medium tracking-tight">
                        Home Spa in <br/>
                        <span className="italic opacity-80">{locationName}</span>
                    </h1>
                </div>



                {/* Cinematic Campaign Card (Below Search) */}
                {campaign && (
                <div onClick={() => setIsCampaignModalOpen(true)} className="block outline-none">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="relative w-full h-[240px] md:h-[420px] rounded-[32px] md:rounded-[40px] overflow-hidden shadow-[0_20px_40px_rgb(0,0,0,0.12)] mb-8 group cursor-pointer bg-primary"
                    >
                        {/* Background Image */}
                        <img 
                            src={campaign.image || "https://images.pexels.com/photos/3757952/pexels-photo-3757952.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop&crop=center"} 
                            alt={campaign.title} 
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]"
                        />
                        
                        {/* Cinematic Vignette & Gradients (Apple-like depth) */}
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-1000"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
                        
                        {/* Content Overlay */}
                        <div className="absolute inset-0 p-6 md:p-12 flex flex-col justify-between z-10">
                            
                            {/* Top Label */}
                            <div className="flex justify-start">
                                <motion.span 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2, duration: 0.6 }}
                                    className="inline-flex items-center px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[8px] md:text-[9px] font-bold tracking-[0.2em] uppercase border border-white/30 text-white shadow-sm"
                                >
                                    {campaign.label}
                                </motion.span>
                            </div>

                            <div className="flex items-end justify-between">
                                <div className="flex flex-col text-white pr-4">
                                    <h2 className="font-serif text-4xl md:text-6xl font-medium leading-tight tracking-tight mb-2 opacity-95 drop-shadow-lg max-w-[220px] md:max-w-[500px]">
                                        {campaign.title}
                                    </h2>
                                    <p className="text-white/80 text-[13px] md:text-base hidden md:block max-w-md leading-relaxed font-light drop-shadow-md">
                                        {campaign.description}
                                    </p>
                                </div>

                                {/* Minimal Apple-style Frosted Button */}
                                <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white/20 backdrop-blur-xl border border-white/30 text-white flex items-center justify-center shrink-0 shadow-[0_8px_32px_rgb(0,0,0,0.15)] group-hover:bg-white/30 group-hover:scale-105 group-active:scale-95 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">
                                    <ArrowRight size={20} strokeWidth={2.5} />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
                )}

                {/* Search & Categories Row */}
                <div className="mb-6 flex flex-col md:flex-row md:items-end justify-start gap-6 md:gap-4 relative z-20">
                    <div className="max-w-full overflow-hidden">
                        <h3 className="text-xs font-semibold text-text-muted mb-3 uppercase tracking-wider">Popular Category</h3>
                        <div className="flex overflow-x-auto pb-4 -mx-6 px-6 md:mx-0 md:px-0 gap-3 no-scrollbar">
                            {CATEGORIES.map((cat) => {
                                const isActive = activeCategory === cat.id;
                                return (
                                    <button
                                        key={cat.id}
                                        onClick={() => setActiveCategory(cat.id)}
                                        className={`flex items-center justify-center px-6 py-3 rounded-full whitespace-nowrap transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                                            isActive 
                                                ? 'bg-primary text-white shadow-[0_8px_20px_rgb(0,0,0,0.12)] scale-[1.02] border border-primary' 
                                                : 'bg-white/40 backdrop-blur-md text-primary border border-white/60 hover:bg-white/80 hover:scale-[1.02]'
                                        }`}
                                    >
                                        <span className="text-sm font-semibold tracking-wide">{cat.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="relative w-full md:w-80 shrink-0 md:mb-4">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none h-[54px]">
                            <Search className="h-5 w-5 text-text-muted" />
                        </div>
                        <input 
                            type="text" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search your favourite treatment..." 
                            className="w-full bg-white/70 backdrop-blur-md border border-white/50 rounded-2xl h-[54px] pl-12 pr-12 text-sm text-primary shadow-soft focus:outline-none focus:ring-2 focus:ring-secondary/50 placeholder:text-text-muted"
                        />
                        <button 
                            onClick={() => setIsPriceFilterOpen(!isPriceFilterOpen)}
                            title="Filter by price"
                            className={`absolute top-2 right-2 w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isPriceFilterOpen ? 'bg-primary text-white shadow-md' : 'bg-secondary/30 text-primary hover:bg-secondary/50'}`}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                        </button>

                        {/* Price Filter Dropdown */}
                        <AnimatePresence>
                            {isPriceFilterOpen && (
                                <motion.div 
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="absolute top-full right-0 mt-3 w-64 md:w-72 bg-white/95 backdrop-blur-xl border border-white/50 rounded-2xl p-5 shadow-[0_20px_40px_rgb(0,0,0,0.12)] z-30"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-primary/80">Max Price</span>
                                        <span className="text-sm font-serif text-primary font-medium">Rp {maxPrice.toLocaleString('en-US')}</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="150000" 
                                        max="1500000" 
                                        step="50000"
                                        value={maxPrice}
                                        onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                                        className="w-full accent-primary h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer"
                                    />
                                    <div className="flex justify-between text-[10px] text-text-muted mt-2 font-medium tracking-wider">
                                        <span>150k</span>
                                        <span>1.5m</span>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Popular Treatments Scroll */}
                <div className="mb-24 relative group">
                    {/* Navigation Buttons (Desktop only) */}
                    <button 
                        onClick={scrollLeft}
                        className="hidden md:flex absolute left-[-20px] lg:left-[-40px] top-[40%] -translate-y-1/2 w-12 h-12 bg-white border border-border/50 rounded-full shadow-lg items-center justify-center z-20 text-primary hover:scale-105 transition-transform"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                    </button>
                    <button 
                        onClick={scrollRight}
                        className="hidden md:flex absolute right-[-20px] lg:right-[-40px] top-[40%] -translate-y-1/2 w-12 h-12 bg-white border border-border/50 rounded-full shadow-lg items-center justify-center z-20 text-primary hover:scale-105 transition-transform"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </button>

                    {treatments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center relative overflow-hidden rounded-[40px] bg-[#F5F5F7] mx-6 md:mx-0">
                            <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-white/0 pointer-events-none"></div>
                            <div className="relative z-10 flex flex-col items-center">
                                <h3 className="text-2xl md:text-3xl font-medium text-[#1D1D1F] tracking-tight mb-2">Treatments Available Soon</h3>
                                <p className="text-[#86868B] max-w-sm mx-auto text-sm font-medium px-4">Contact us to book a treatment for this area.</p>
                            </div>
                        </div>
                    ) : (
                    <div ref={scrollContainerRef} className="flex overflow-x-auto pb-10 -mx-6 px-6 md:mx-0 md:px-0 gap-6 no-scrollbar scroll-smooth">
                        {filteredAndSortedTreatments.map((item, idx) => (
                            <Link href={`/rituals/${createSlug(item.title)}`} key={item.id} className="w-72 md:w-80 shrink-0 block group outline-none">
                                <div className={`rounded-[32px] md:rounded-[40px] bg-gradient-to-br ${item.bgPattern} border border-border/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-700 flex flex-col h-full relative overflow-hidden group-hover:-translate-y-2 p-6 md:p-8`}>
                                    
                                    {/* Subtle glowing orb for spa ambiance */}
                                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/60 blur-[30px] rounded-full pointer-events-none transition-transform duration-700 group-hover:scale-150"></div>

                                    <div className="mb-8 flex items-start justify-between relative z-10">
                                        <div className="bg-white/60 backdrop-blur-sm border border-primary/10 text-primary px-4 py-2 rounded-full text-[10px] font-bold tracking-widest uppercase shadow-sm">
                                            {item.category}
                                        </div>
                                    </div>

                                    <div className="relative z-10 flex-grow flex flex-col">
                                        <h4 className="font-serif text-xl font-medium text-primary mb-3 leading-tight">{item.title}</h4>
                                        <p className="text-xs text-text-muted leading-relaxed font-light mb-6 flex-grow line-clamp-4">{item.desc.charAt(0).toUpperCase() + item.desc.slice(1).toLowerCase()}</p>
                                        
                                        <div className="mt-auto pt-5 border-t border-border/50">
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-text-muted mb-3 uppercase tracking-widest">
                                                <Clock className="w-3.5 h-3.5" /> {item.options[0]?.duration} MINS
                                            </div>
                                            <div className="flex items-center justify-between bg-white/80 backdrop-blur-sm rounded-full p-1 pl-4 border border-gray-100">
                                                <span className="font-semibold text-gray-900 text-[14px]">IDR {parseInt(item.options[0]?.price.replace(/,/g, '') || '0').toLocaleString('en-US')}</span>
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
                    )}
                </div>

                {/* The Elexoir Boutique Section */}
                {products.length > 0 && (
                <div className="mb-32">
                    <div className="flex items-center justify-between mb-8 px-6 md:px-0">
                        <div>
                            <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-primary/50 mb-1 block">Take the Spa Home</span>
                            <h3 className="font-serif text-2xl md:text-3xl text-primary font-medium leading-tight">Spa Boutique</h3>
                        </div>
                        <Link href="/store" className="inline-flex items-center justify-center gap-2 bg-primary text-white px-5 py-2.5 rounded-full text-xs font-medium hover:bg-primary/90 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 whitespace-nowrap shrink-0">
                            Shop Now
                        </Link>
                    </div>
                    
                    {/* Swipeable Products */}
                    <div className="flex overflow-x-auto pb-10 -mx-6 px-6 md:mx-0 md:px-0 gap-6 no-scrollbar">
                        {products.map((product) => (
                            <Link href="/store" key={product.id} className="w-48 md:w-52 shrink-0 block outline-none">
                                <div className="bg-white border border-[#E5E7EB] rounded-[24px] flex flex-col h-full hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 relative group p-2">
                                    
                                    {/* Image */}
                                    <div className="aspect-[4/5] relative bg-[#F5F5F7] overflow-hidden rounded-[16px]">
                                        <img src={product.image} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    </div>
                                    
                                    {/* Text Info */}
                                    <div className="flex flex-col flex-grow px-2 md:px-3 pt-3 pb-2">
                                        <p className="text-gray-400 text-[11px] font-medium mb-1 line-clamp-1">{product.category || 'Elexoir'}</p>
                                        <h4 className="font-bold text-gray-900 text-sm line-clamp-1 mb-4">{product.title}</h4>
                                        
                                        {/* Price and Add Button */}
                                        <div className="flex items-center justify-between bg-white rounded-full p-1 pl-3 mt-auto border border-gray-100">
                                            <span className="font-semibold text-gray-900 text-[13px]">Rp {parseInt(product.price.replace(/,/g, '')).toLocaleString('id-ID')}</span>
                                            <div className="w-8 h-8 rounded-full bg-[#1D1D1F] text-white flex items-center justify-center hover:bg-black transition-colors shrink-0 shadow-sm">
                                                <Plus size={16} strokeWidth={2.5} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
                )}

                {/* About Us */}
                <div className="mb-24 flex flex-col md:flex-row gap-12 md:gap-24 items-center">
                    <div className="flex-1">
                        <span className="text-xs font-bold uppercase tracking-widest text-primary/50 mb-4 block">Our Philosophy</span>
                        <h3 className="font-serif text-4xl md:text-5xl text-primary font-medium mb-6 leading-tight">
                            Sanctuary for the Soul
                        </h3>
                        <p className="text-text-muted leading-relaxed mb-8 font-light">
                            Born from the ancient healing traditions of Bali, Elexoir Home Spa was created with a singular vision: to bring unparalleled luxury and profound relaxation directly to your sanctuary. We believe that true wellness requires an environment where you feel completely at ease—your own home or villa.
                        </p>
                        <button className="text-primary text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:opacity-70 transition-opacity">
                            Discover Our Story <ArrowRight size={16} />
                        </button>
                    </div>
                    <div className="flex-1 w-full relative">
                        <div className="aspect-[4/3] rounded-[40px] overflow-hidden bg-gradient-to-br from-highlight/60 to-surface border border-white shadow-soft relative flex items-center justify-center p-8 text-center">
                             <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.8),transparent_100%)] pointer-events-none"></div>
                             <div className="relative z-10">
                                 <h4 className="font-serif text-3xl text-primary mb-3 italic">"A journey to pure tranquility."</h4>
                                 <p className="text-[10px] text-primary/60 uppercase tracking-widest font-bold">Vogue Wellness</p>
                             </div>
                        </div>
                    </div>
                </div>
                
            </div>

            {/* Campaign Modal */}
            {isCampaignModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm">
                    <motion.div 
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 100 }}
                        className="bg-[#FDFBF7] w-full h-[90dvh] md:h-auto md:max-h-[85vh] md:max-w-3xl md:rounded-[40px] rounded-t-[40px] shadow-2xl relative overflow-hidden flex flex-col"
                    >
                        {/* Modal Header */}
                        <div className="p-6 md:p-8 flex items-center justify-between border-b border-border/50 bg-white shrink-0">
                            <div>
                                <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-[9px] font-bold tracking-widest uppercase text-primary mb-2">
                                    {campaign?.title}
                                </div>
                                <h2 className="font-serif text-2xl text-primary">{campaign?.label}</h2>
                            </div>
                            <button 
                                onClick={() => setIsCampaignModalOpen(false)}
                                className="w-10 h-10 rounded-full bg-surface flex items-center justify-center text-primary hover:bg-border transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        
                        {/* Modal Content (Campaign Treatments) */}
                        <div className="p-6 md:p-8 overflow-y-auto bg-[#FDFBF7]">
                            <p className="text-sm text-text-muted mb-6">{campaign?.description}</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {campaign?.selectedTreatments.flatMap(ct => {
                                    const treatment = treatments.find(t => t.id === ct.treatmentId);
                                    if (!treatment) return [];
                                    
                                    return ct.durations.map(duration => {
                                        const option = treatment.options.find(o => o.duration === duration);
                                        if (!option) return null;
                                        
                                        const originalPriceNum = parseInt(option.price.replace(/,/g, ''));
                                        const discountedPriceNum = originalPriceNum * (1 - (campaign.discountPercentage / 100));
                                        
                                        return (
                                            <div key={`${treatment.id}-${duration}`} className="block group outline-none cursor-pointer" onClick={() => {
                                                setCartItems([{
                                                    id: Date.now().toString(),
                                                    treatmentId: treatment.id,
                                                    campaignTitle: campaign.title,
                                                    title: treatment.title,
                                                    duration: duration,
                                                    price: discountedPriceNum,
                                                    guests: 1,
                                                    isCampaign: true,
                                                    discountPercentage: campaign.discountPercentage
                                                }]);
                                                setIsBookingModalOpen(true);
                                            }}>
                                                <div className="rounded-[32px] p-6 bg-white border border-border/40 shadow-sm hover:shadow-md transition-all duration-500 flex flex-col h-full relative overflow-hidden group-hover:-translate-y-1">
                                                    <div className="mb-4 flex items-start justify-between">
                                                        <div className="bg-primary/5 border border-primary/10 text-primary px-3 py-1.5 rounded-full text-[9px] font-bold tracking-widest uppercase shadow-sm">
                                                            {treatment.category}
                                                        </div>
                                                        <div className="bg-primary text-white px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest shadow-sm">
                                                            -{campaign.discountPercentage}%
                                                        </div>
                                                    </div>
                                                    <h4 className="font-serif text-xl font-medium text-primary mb-2 leading-tight">{treatment.title}</h4>
                                                    <p className="text-xs text-text-muted leading-relaxed font-light mb-6 flex-grow">{treatment.desc}</p>
                                                    
                                                    <div className="mt-auto pt-4 border-t border-border/50">
                                                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-text-muted mb-2.5 uppercase tracking-widest"><Clock className="w-3.5 h-3.5" /> {duration} MINS</div>
                                                        <div className="flex items-end justify-between">
                                                            <div>
                                                                <span className="text-[10px] text-text-muted line-through mr-2">Rp {option.price}</span>
                                                                <span className="font-serif text-lg text-primary">Rp {discountedPriceNum.toLocaleString('en-US')}</span>
                                                            </div>
                                                            <button className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                                                <ArrowRight size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    });
                                })}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Complete Booking Modal */}
            <AnimatePresence>
                {isBookingModalOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[110] flex items-center justify-center px-0 md:px-4 bg-black/40 backdrop-blur-sm"
                    >
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white rounded-none md:rounded-[32px] p-6 md:p-8 w-full h-[100dvh] md:h-auto md:max-h-[90vh] md:max-w-md shadow-2xl relative overflow-y-auto overflow-x-hidden no-scrollbar"
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
                                            totalPrice: cartItems.reduce((sum, item) => sum + (item.price * item.guests), 0)
                                        });
                                    }
                                    setIsBookingModalOpen(false);
                                }}
                                className="absolute top-6 right-6 w-8 h-8 rounded-full bg-surface flex items-center justify-center text-text-muted hover:bg-border transition-colors z-10"
                            >
                                <X className="w-4 h-4" />
                            </button>
                            
                            {isSelectingMore ? (
                                <div className="animate-in fade-in slide-in-from-right-4 duration-300 pb-4">
                                    <div className="flex items-center gap-4 mb-6">
                                        <button onClick={() => setIsSelectingMore(false)} className="w-8 h-8 rounded-full bg-surface flex items-center justify-center hover:bg-border transition-colors shrink-0">
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>
                                        <h2 className="font-serif text-2xl text-primary">Select Treatment</h2>
                                    </div>
                                    
                                    <div className="space-y-3 max-h-[calc(100dvh-110px)] md:max-h-[70vh] overflow-y-auto pr-2 pb-16 no-scrollbar">
                                        {treatments.map(t => (
                                            <div 
                                                key={t.id} 
                                                className={`bg-surface border ${expandedTreatmentId === t.id ? 'border-primary' : 'border-border/50'} rounded-2xl overflow-hidden shadow-sm transition-all`}
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
                                                                                        guests: isCouple ? 2 : 1,
                                                                                        isCampaign: false
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
                                            <div key={item.id} className="bg-white border border-border/80 rounded-2xl p-4 shadow-sm relative">
                                                
                                                <div className="flex items-start justify-between mb-4 pr-6">
                                                    <div>
                                                        {item.isCampaign && (
                                                            <div className="bg-primary text-white px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest inline-flex items-center gap-1 whitespace-nowrap mb-1.5 shadow-sm">
                                                                <span>{item.campaignTitle}</span>
                                                            </div>
                                                        )}
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
                                                                        setIsBookingModalOpen(false);
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
                                        className="w-full bg-white text-primary border border-border/80 px-6 py-3.5 rounded-xl text-xs font-bold shadow-sm hover:bg-white transition-colors mb-6 tracking-widest"
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
                                        <div className="space-y-1.5 w-full">
                                            <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-primary/80 ml-1"><MapPin className="w-3.5 h-3.5"/> Villa / Hotel Name</label>
                                            <input 
                                                type="text" required placeholder="e.g. Four Seasons Sayan"
                                                value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})}
                                                className="w-full bg-white border border-border/80 rounded-xl px-4 py-3.5 text-sm text-primary placeholder:text-text-muted/50 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                            />
                                        </div>
                                        <div className="space-y-1.5 w-full">
                                            <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-primary/80 ml-1"><DoorOpen className="w-3.5 h-3.5"/> Room Number (Optional)</label>
                                            <input 
                                                type="text" placeholder="e.g. Villa 12"
                                                value={formData.room} onChange={e => setFormData({...formData, room: e.target.value})}
                                                className="w-full bg-white border border-border/80 rounded-xl px-4 py-3.5 text-sm text-primary placeholder:text-text-muted/50 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                            />
                                        </div>

                                        <div className="mt-8 pt-6 border-t border-border/50">
                                            <div className="flex items-end justify-between mb-6">
                                                <span className="text-xs font-bold text-text-muted uppercase tracking-widest">Total Price</span>
                                                <span className="text-2xl font-serif text-primary">IDR {cartItems.reduce((acc, item) => {
                                                    const isCouple = ['couple', 'honeymoon'].some(k => item.title.toLowerCase().includes(k));
                                                    const multiplier = isCouple ? (item.guests / 2) : item.guests;
                                                    return acc + (item.price * multiplier);
                                                }, 0).toLocaleString('en-US')}</span>
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
                                            <div className="flex flex-col gap-3">
                                                <button
                                                    type="button"
                                                    onClick={(e) => handleCampaignBooking(e)}
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


            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <SeoExpandedContent />
                <WhyChooseUs />
                <ServiceAreas />
                <FaqSection />
            </div>
                </div>
            )}
        </>
    );
}
