'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Search, Heart, Cloud, Sparkles, Droplet, User, Flame, Clock, ArrowRight, X, ShoppingBag, Plus, Minus, MessageCircle, ChevronLeft, ChevronDown, Bitcoin, CheckCircle2, Copy, Calendar, MapPin, Tag, DoorOpen, Trash2, Info, Check } from 'lucide-react';
import Link from 'next/link';
import { saveBookingToSupabase } from '@/lib/bookingUtils';
import { calculateCartTotal, getItemMultiplier } from '@/lib/pricingUtils';
import { useCart } from '@/context/CartContext';
import { useSpa } from '@/context/SpaContext';
import SeoExpandedContent from '@/components/SeoExpandedContent';
import WhyChooseUs from '@/components/WhyChooseUs';
import ServiceAreas from '@/components/ServiceAreas';
import FaqSection from '@/components/FaqSection';
import { createSlug } from '@/utils/slugify';
import { SPA_ADDONS } from '@/lib/constants';

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

    const { treatments, campaign, products, isLoaded, siteBrandFilter } = useSpa();

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
    const [selectedAddonItem, setSelectedAddonItem] = useState<any | null>(null);
    const [promoCode, setPromoCode] = useState('');
    const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
    const [promoError, setPromoError] = useState<string | null>(null);
    const [isSelectingMore, setIsSelectingMore] = useState(false);
    const [expandedTreatmentId, setExpandedTreatmentId] = useState<string | null>(null);
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [isReviewingBooking, setIsReviewingBooking] = useState(false);
    const [detailsModalTreatment, setDetailsModalTreatment] = useState<any>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [massageTableCount, setMassageTableCount] = useState<number>(0);
    const [showTableFeeModal, setShowTableFeeModal] = useState<boolean>(false);
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
    
    // Initialize date and time
    const getInitialDateTime = () => {
        const now = new Date();
        const date = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
        const time = now.toTimeString().split(' ')[0].substring(0, 5);
        return { date, time };
    };
    
    const [formData, setFormData] = useState({ name: '', location: '', room: '', whatsapp: '', ...getInitialDateTime() });
    const isTherapick = siteBrandFilter === 'therapick' || (typeof window !== 'undefined' && (window.location.hostname.includes('therapick') || window.location.hostname.includes('booktherapick')));

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

    const handleCampaignBooking = async (e?: React.FormEvent) => {
        if (e && e.preventDefault) e.preventDefault();
        
        if (cartItems.length === 0) {
            alert('Your cart is empty.');
            return;
        }

        if (!formData.name || !formData.date || !formData.time || !formData.location || (isTherapick && !formData.whatsapp)) {
            alert(`Please fill in all required fields (Name, Date, Time, Location${isTherapick ? ', WhatsApp Number' : ''}).`);
            return;
        }

        const newWindow = window.open('', '_blank');
        setIsProcessing(true);
        
        try {
            const tableFee = isTherapick ? (massageTableCount * 100000) : 0;
            const pricing = calculateCartTotal(cartItems, appliedPromo || undefined, tableFee);
            const totalPrice = pricing.total;
            const waNumber = '6285174119423';
            
            const rawHost = typeof window !== 'undefined' ? window.location.hostname : 'booktherapick.com';
            const cleanHost = rawHost.replace(/^https?:\/\//, '').replace(/\/$/, '');
            const websiteSource = cleanHost.startsWith('www.') ? cleanHost : `www.${cleanHost}`;

            const promoText = appliedPromo ? `\n*PROMO CODE:* ${appliedPromo} (-IDR ${pricing.discount.toLocaleString('en-US')})` : '';

            let baseMessage = '';
            if (isTherapick) {
                const tableChoice = massageTableCount > 0 
                    ? `${massageTableCount} Portable Table${massageTableCount > 1 ? 's' : ''} (+IDR ${(massageTableCount * 100000).toLocaleString('en-US')})` 
                    : 'Standard Setup (No Portable Table)';

                const treatmentsList = cartItems.map((item, idx) => {
                    const isCouple = ['couple', 'honeymoon'].some(k => item.title.toLowerCase().includes(k));
                    const multiplier = isCouple ? (item.guests / 2) : item.guests;
                    const addonsPrice = (item.addons || []).reduce((acc: number, add: any) => acc + (Number(add.price) || 0), 0);
                    const singlePrice = item.price + addonsPrice;
                    const totalItemPrice = (singlePrice * multiplier).toLocaleString('en-US');

                    const guestAndPriceText = isCouple 
                        ? (item.guests === 2 ? `1 COUPLE (2 PERSONS) • IDR ${totalItemPrice}` : `${item.guests / 2} COUPLES (${item.guests} PERSONS) • IDR ${totalItemPrice}`)
                        : `${item.guests} PERSON${item.guests > 1 ? 'S' : ''} • IDR ${totalItemPrice}`;

                    const addonsText = item.addons && item.addons.length > 0
                        ? `\n*ADD-ONS:* ${item.addons.map((a: any) => `${a.title} (+IDR ${Number(a.price).toLocaleString('en-US')})`).join(', ')}`
                        : '';

                    if (item.isCampaign && item.discountPercentage && Number(item.discountPercentage) > 0) {
                        const originalPriceNum = item.price / (1 - (item.discountPercentage / 100));
                        const originalPrice = ((originalPriceNum + addonsPrice) * multiplier).toLocaleString('en-US');
                        const priceText = `~IDR ${originalPrice}~ [${item.discountPercentage}% OFF SPA]`;
                        return `*${idx + 1}. ${item.title.toUpperCase()}*\nDuration: ${item.duration} Mins\n${guestAndPriceText} ${priceText}${addonsText}`;
                    }

                    return `*${idx + 1}. ${item.title.toUpperCase()}*\nDuration: ${item.duration} Mins\n${guestAndPriceText}${addonsText}`;
                }).join('\n\n------------------------\n\n');

                baseMessage = `*NEW SPA BOOKING*\n${websiteSource}\n\n*SERVICE AREA:* ${locationName}\n*TREATMENTS:*\n${treatmentsList}\n\n*SETUP PREFERENCE:* ${tableChoice}\n\n*TOTAL PRICE:* IDR ${totalPrice.toLocaleString('en-US')}${promoText}\n\n*CLIENT DETAILS:*\n• Name: ${formData.name}\n• Date: ${formData.date}\n• Time: ${formData.time}\n• Location/Villa: ${formData.location}\n• Room Number: ${formData.room || 'N/A'}\n• WhatsApp: ${formData.whatsapp || 'N/A'}\n\nHello! I would like to confirm this booking.`;
            } else {
                const treatmentsList = cartItems.map(item => {
                    const isCouple = ['couple', 'honeymoon'].some(k => item.title.toLowerCase().includes(k));
                    const multiplier = isCouple ? (item.guests / 2) : item.guests;
                    const price = (item.price * multiplier).toLocaleString('en-US');
                    const itemTreatment = treatments.find(t => t.id === item.treatmentId || t.title === item.title);

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

                baseMessage = `*NEW SPA BOOKING*\n${websiteSource}\n\n*SERVICE AREA:* ${locationName}\n*TREATMENTS:*\n${treatmentsList}\n\n*TOTAL PRICE:* IDR ${totalPrice.toLocaleString('en-US')}${promoText}\n\n*CLIENT DETAILS:*\n• Name: ${formData.name}\n• Date: ${formData.date}\n• Time: ${formData.time}\n• Location/Villa: ${formData.location}\n• Room Number: ${formData.room || 'N/A'}\n\nHello! I would like to confirm this booking.`;
            }

            // Save to Supabase before opening WhatsApp
            const activeBrand = siteBrandFilter || 'therapick';
            await saveBookingToSupabase(
                bookingIdRef.current,
                formData,
                cartItems,
                totalPrice,
                activeBrand
            );

            const finalMessage = baseMessage + '\n\n*BOOKING ID :* ' + bookingIdRef.current;
            
            saveDraft({
                id: bookingIdRef.current,
                date: new Date().toISOString(),
                status: 'confirmed',
                items: cartItems,
                customerDetails: formData,
                totalPrice: totalPrice
            });
    
            const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(finalMessage)}`;
            if (newWindow) {
                newWindow.location.href = waUrl;
            } else {
                window.location.href = waUrl;
            }
            
            setCartItems([]);
            setIsBookingModalOpen(false);
            setIsReviewingBooking(false);
            setTherapickStep('selection');
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
                <div className="min-h-screen bg-white relative overflow-hidden font-sans text-text pb-24 md:pb-12">
            
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



                {/* Ticket Style Campaign Card (Below Search) */}
                {campaign && (
                <div onClick={() => setIsCampaignModalOpen(true)} className="block outline-none">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        className="relative w-full flex flex-row rounded-[24px] overflow-hidden shadow-sm group transition-colors duration-300 border border-gray-200 bg-[#FAFAFA] min-h-[180px] md:min-h-[200px] mb-8 cursor-pointer"
                    >
                        {/* Left Section (Blue) */}
                        <div className="flex-1 bg-[#3b82f6] text-white p-5 md:p-6 flex flex-col justify-between relative z-10">
                            <div>
                                <div className="inline-flex items-center text-[10px] md:text-xs font-bold tracking-wide uppercase mb-3 text-white/90">
                                    {campaign.label || `${campaign.discountPercentage}% OFF`}
                                </div>
                                <h3 className="text-xl md:text-2xl font-bold leading-tight mb-2">
                                    {campaign.title}
                                </h3>
                                {campaign.description && (
                                    <p className="text-white/80 text-xs md:text-sm line-clamp-2 leading-relaxed max-w-[95%]">
                                        {campaign.description}
                                    </p>
                                )}
                            </div>
                            <div className="mt-4 flex items-center">
                                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white transition-transform group-hover:scale-105">
                                    <ArrowRight size={14} />
                                </div>
                            </div>
                        </div>
                        
                        {/* Divider with Cutouts */}
                        <div className="relative w-0 flex flex-col justify-between items-center z-20">
                            {/* Top Cutout */}
                            <div className="absolute top-0 -translate-x-1/2 -translate-y-1/2 w-6 h-6 md:w-8 md:h-8 bg-[#FAFAFA] rounded-full border border-gray-200 shadow-inner"></div>
                            
                            {/* Vertical Dashed Line */}
                            <div className="absolute top-0 bottom-0 -translate-x-1/2 border-l-[3px] border-dotted border-gray-300/70 z-[-1]"></div>

                            {/* Bottom Cutout */}
                            <div className="absolute bottom-0 -translate-x-1/2 translate-y-1/2 w-6 h-6 md:w-8 md:h-8 bg-[#FAFAFA] rounded-full border border-gray-200 shadow-inner"></div>
                        </div>

                        {/* Right Section (White) */}
                        <div className="w-[90px] md:w-[120px] bg-white flex flex-col items-center justify-center py-4 px-2 shrink-0 text-center relative z-10">
                            <div className="flex flex-col items-center justify-center gap-3">
                                {/* Start Date */}
                                <div className="flex flex-col items-center">
                                    <div className="text-[8px] md:text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Start</div>
                                    {campaign.startDate ? (
                                        <>
                                            <div className="text-[10px] md:text-xs font-bold text-gray-800 uppercase leading-none">{new Date(campaign.startDate).toLocaleDateString('en-US', { month: 'short' })}</div>
                                            <div className="text-xl md:text-2xl font-black text-black leading-none my-0.5">{new Date(campaign.startDate).getDate()}</div>
                                            <div className="text-[9px] md:text-[10px] font-bold text-gray-500 uppercase leading-none">{new Date(campaign.startDate).getFullYear()}</div>
                                        </>
                                    ) : (
                                        <div className="text-xs md:text-sm font-bold text-black uppercase">NOW</div>
                                    )}
                                </div>
                                
                                <div className="w-6 h-px bg-gray-200"></div>

                                {/* End Date */}
                                <div className="flex flex-col items-center">
                                    <div className="text-[8px] md:text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">End</div>
                                    {campaign.endDate ? (
                                        <>
                                            <div className="text-[10px] md:text-xs font-bold text-gray-800 uppercase leading-none">{new Date(campaign.endDate).toLocaleDateString('en-US', { month: 'short' })}</div>
                                            <div className="text-xl md:text-2xl font-black text-black leading-none my-0.5">{new Date(campaign.endDate).getDate()}</div>
                                            <div className="text-[9px] md:text-[10px] font-bold text-gray-500 uppercase leading-none">{new Date(campaign.endDate).getFullYear()}</div>
                                        </>
                                    ) : (
                                        <div className="text-[10px] md:text-xs font-bold text-black uppercase">{campaign.duration.replace('_', ' ')}</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
                )}

                {/* Search & Categories Row */}
                <div className="mb-6 flex flex-col md:flex-row md:items-end justify-start gap-6 md:gap-4 relative z-20">
                    <div className="max-w-full overflow-hidden w-full">
                        <div className="flex items-center justify-between mb-4 w-full md:pr-0">
                            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">Popular Category</h3>
                            <Link href="/explore" className="inline-flex items-center justify-center bg-white border border-gray-200 text-gray-800 px-4 py-2 rounded-full text-[11px] font-bold tracking-wide hover:bg-gray-50 hover:shadow-sm transition-all whitespace-nowrap ml-2 shadow-sm">
                                View All Treatments
                            </Link>
                        </div>
                        <div className="flex overflow-x-auto pb-4 -mx-6 px-6 md:mx-0 md:px-0 gap-2.5 no-scrollbar">
                            {CATEGORIES.map((cat) => {
                                const isActive = activeCategory === cat.id;
                                return (
                                    <button
                                        key={cat.id}
                                        onClick={() => setActiveCategory(cat.id)}
                                        className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-[20px] whitespace-nowrap transition-all duration-300 font-medium ${
                                            isActive 
                                                ? 'bg-[#1D1D1F] text-white shadow-[0_4px_16px_rgba(0,0,0,0.18)] scale-[1.02] border border-black font-semibold' 
                                                : 'bg-white text-gray-700 border border-gray-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:border-gray-400 hover:shadow-md hover:bg-gray-50 active:scale-95'
                                        }`}
                                    >
                                        <span className="text-xs sm:text-sm tracking-wide">{cat.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="relative w-full md:w-80 shrink-0 md:mb-4">
                        <div className="w-full bg-white rounded-[24px] border border-gray-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.09)] transition-all duration-300 flex items-center p-1.5 pl-3.5 focus-within:border-black focus-within:ring-2 focus-within:ring-black/5">
                            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 mr-2 shrink-0">
                                <Search className="h-4 w-4 text-gray-700" />
                            </div>
                            <input 
                                type="text" 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search your favourite treatment..." 
                                className="w-full bg-transparent border-none text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0 p-0 h-[44px]"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery('')}
                                    className="p-1.5 text-gray-400 hover:text-black mr-1 transition-colors"
                                    title="Clear search"
                                >
                                    <X size={15} />
                                </button>
                            )}
                            <button 
                                onClick={() => setIsPriceFilterOpen(!isPriceFilterOpen)}
                                title="Filter by price"
                                className={`w-10 h-10 rounded-[18px] flex items-center justify-center transition-all shrink-0 ${isPriceFilterOpen ? 'bg-black text-white shadow-md' : 'bg-gray-100/90 text-gray-700 hover:bg-black hover:text-white'}`}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                            </button>
                        </div>

                        {/* Price Filter Dropdown */}
                        <AnimatePresence>
                            {isPriceFilterOpen && (
                                <motion.div 
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="absolute top-full right-0 mt-3 w-64 md:w-72 bg-white rounded-[24px] border border-gray-200 p-5 shadow-[0_20px_40px_rgb(0,0,0,0.12)] z-30"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Max Price</span>
                                        <span className="text-sm font-semibold text-gray-900">IDR {maxPrice.toLocaleString('en-US')}</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="150000" 
                                        max="1500000" 
                                        step="50000" 
                                        value={maxPrice} 
                                        onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                                        className="w-full accent-black h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                    />
                                    <div className="flex justify-between text-[10px] text-gray-400 mt-2 font-medium tracking-wider">
                                        <span>150k</span>
                                        <span>1.5m</span>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Popular Treatments Scroll */}
                <section data-reveal className="mb-24 relative group scroll-reveal">
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
                    <div ref={scrollContainerRef} className="flex overflow-x-auto pb-10 -mx-6 px-6 md:mx-0 md:px-0 gap-6 no-scrollbar scroll-smooth scroll-reveal-stagger">
                        {filteredAndSortedTreatments.map((item, idx) => (
                            <Link href={`/rituals/${createSlug(item.title)}`} prefetch={true} key={item.id} className="w-72 md:w-80 shrink-0 block group outline-none active:scale-[0.98] transition-all">
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
                                                <div className="w-10 h-10 rounded-full bg-[#1D1D1F] text-white flex items-center justify-center group-hover:bg-black transition-colors shrink-0 shadow-sm">
                                                    <Plus size={20} strokeWidth={2.5} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                    )}
                </section>

                {/* The Elexoir Boutique Section */}
                {products.length > 0 && (
                <section data-reveal className="mb-32 scroll-reveal">
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
                    <div className="flex overflow-x-auto pb-10 -mx-6 px-6 md:mx-0 md:px-0 gap-6 no-scrollbar scroll-reveal-stagger">
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
                </section>
                )}

                {/* About Us */}
                <section data-reveal className="mb-24 flex flex-col md:flex-row gap-12 md:gap-24 items-center scroll-reveal">
                    <div className="flex-1 scroll-reveal-left">
                        <span className="text-xs font-bold uppercase tracking-widest text-primary/50 mb-4 block">Our Philosophy</span>
                        <h3 className="font-serif text-4xl md:text-5xl text-primary font-medium mb-6 leading-tight">
                            Sanctuary for the Soul
                        </h3>
                        <p className="text-text-muted leading-relaxed mb-8 font-light">
                            Born from the ancient healing traditions of Bali, {siteBrandFilter === 'therapick' ? 'Therapick' : siteBrandFilter === 'bali' ? 'Home Spa Ubud' : 'Elexoir Home Spa'} was created with a singular vision: to bring unparalleled luxury and profound relaxation directly to your sanctuary. We believe that true wellness requires an environment where you feel completely at ease—your own home or villa in {locationName}.
                        </p>
                        <button className="text-primary text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:opacity-70 transition-opacity">
                            Discover Our Story <ArrowRight size={16} />
                        </button>
                    </div>
                    <div className="flex-1 w-full relative scroll-reveal-right">
                        <div className="aspect-[4/3] rounded-[40px] overflow-hidden bg-gradient-to-br from-highlight/60 to-surface border border-white shadow-soft relative flex items-center justify-center p-8 text-center">
                             <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.8),transparent_100%)] pointer-events-none"></div>
                             <div className="relative z-10">
                                 <h4 className="font-serif text-3xl text-primary mb-3 italic">"A journey to pure tranquility."</h4>
                                 <p className="text-[10px] text-primary/60 uppercase tracking-widest font-bold">Vogue Wellness</p>
                             </div>
                        </div>
                    </div>
                </section>
                
            </div>

            {/* Campaign Modal */}
            <AnimatePresence>
                {isCampaignModalOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 30 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        className="fixed inset-0 z-[100] w-full h-[100dvh] bg-[#F8F9FA] flex flex-col overflow-hidden text-black font-sans"
                    >
                        {/* Modal Top Bar */}
                        <div className="shrink-0 bg-white/95 backdrop-blur-md border-b border-gray-200/90 px-4 sm:px-6 py-3.5 flex items-center justify-between shadow-sm z-30">
                            <button
                                onClick={() => setIsCampaignModalOpen(false)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 hover:bg-black hover:text-white text-gray-800 text-xs font-bold transition-all shadow-sm group"
                            >
                                <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                                <span>Back</span>
                            </button>

                            <div />

                            <button
                                onClick={() => setIsCampaignModalOpen(false)}
                                className="w-9 h-9 rounded-full bg-gray-100 hover:bg-black hover:text-white text-gray-700 flex items-center justify-center transition-all shadow-sm"
                                aria-label="Close"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Modal Scrollable Content */}
                        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 md:p-8 space-y-6 max-w-4xl mx-auto w-full">
                            {/* Campaign Hero Banner */}
                            <div className="bg-gradient-to-br from-white via-white to-blue-50/40 rounded-[28px] border border-gray-200/90 p-5 sm:p-7 shadow-sm relative overflow-hidden">
                                <div className="relative z-10">
                                    <div className="text-[10px] font-bold text-[#3b82f6] uppercase tracking-widest mb-1.5">
                                        Exclusive Campaign Offer
                                    </div>
                                    <h2 className="font-serif text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mb-2">
                                        {campaign?.title}
                                    </h2>
                                    {campaign?.description && (
                                        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-light max-w-2xl">
                                            {campaign.description}
                                        </p>
                                    )}
                                    <div className="mt-4 flex items-center gap-3 text-[11px] font-semibold text-gray-500 flex-wrap">
                                        {campaign?.endDate && (
                                            <span className="inline-flex items-center gap-1.5 bg-gray-100/80 px-3 py-1 rounded-full text-gray-700">
                                                <Clock size={13} className="text-gray-500" />
                                                Valid until {new Date(campaign.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Treatment Selection Grid */}
                            <div className="pb-10">
                                <div className="flex items-center justify-between gap-3 mb-4 px-1">
                                    <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-800">
                                        {Number(campaign?.discountPercentage) > 0
                                            ? 'Select Treatment to Activate Discount'
                                            : 'Select Treatment'}
                                    </h3>
                                    <div className="shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50/90 border border-blue-200/80 text-[#1d4ed8] text-[11px] font-bold shadow-xs">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#2563eb]"></span>
                                        <span>{campaign?.selectedTreatments?.length || 0} Available</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {campaign?.selectedTreatments.flatMap(ct => {
                                        const treatment = treatments.find(t => t.id === ct.treatmentId);
                                        if (!treatment) return [];

                                        return ct.durations.map(duration => {
                                            const option = treatment.options.find(o => o.duration === duration);
                                            if (!option) return null;

                                            const originalPriceNum = parseInt(option.price.replace(/,/g, ''));
                                            const discount = campaign.discountPercentage || 0;
                                            const discountedPriceNum = originalPriceNum * (1 - (discount / 100));

                                            const handleBookTreatment = () => {
                                                setCartItems([{
                                                    id: Date.now().toString(),
                                                    treatmentId: treatment.id,
                                                    campaignTitle: campaign.title,
                                                    title: treatment.title,
                                                    duration: duration,
                                                    price: discountedPriceNum,
                                                    guests: 1,
                                                    isCampaign: true,
                                                    discountPercentage: campaign.discountPercentage,
                                                    massageTable: true,
                                                    addons: []
                                                }]);
                                                setIsCampaignModalOpen(false);
                                                setIsBookingModalOpen(true);
                                            };

                                            return (
                                                <div
                                                    key={`${treatment.id}-${duration}`}
                                                    onClick={handleBookTreatment}
                                                    className="relative w-full flex flex-row rounded-[24px] overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-200/90 bg-[#FAFAFA] min-h-[175px] md:min-h-[195px] cursor-pointer group active:scale-[0.99]"
                                                >
                                                    {/* Left Section (Blue) */}
                                                    <div className="flex-1 bg-[#3b82f6] text-white p-4 sm:p-5 md:p-6 flex flex-col justify-between relative z-10">
                                                        <div>
                                                            {/* Badges Row */}
                                                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-black/35 backdrop-blur-sm text-white text-[9px] md:text-[10px] font-bold tracking-widest uppercase border border-white/15">
                                                                    {treatment.category}
                                                                </span>
                                                            </div>

                                                            {/* Treatment Title */}
                                                            <h4 className="text-base sm:text-lg md:text-xl font-bold leading-tight mb-1.5 text-white tracking-tight">
                                                                {treatment.title}
                                                            </h4>

                                                            {/* Treatment Description */}
                                                            {treatment.desc && (
                                                                <p className="text-white/80 text-xs md:text-sm line-clamp-2 leading-relaxed max-w-[95%] font-light">
                                                                    {treatment.desc}
                                                                </p>
                                                            )}
                                                        </div>

                                                        {/* Bottom Row */}
                                                        <div className="mt-3 pt-3 border-t border-white/20 flex items-center gap-2">
                                                            <div className="inline-flex items-center gap-1.5 text-white text-[11px] font-bold uppercase tracking-wider bg-white/20 px-3 py-1.5 rounded-xl border border-white/30 backdrop-blur-sm">
                                                                <Clock className="w-3.5 h-3.5 text-white/90" />
                                                                <span>{duration.toUpperCase().includes('MIN') ? duration : `${duration} MINS`}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Divider with Cutouts */}
                                                    <div className="relative w-0 flex flex-col justify-between items-center z-20">
                                                        <div className="absolute top-0 -translate-x-1/2 -translate-y-1/2 w-6 h-6 md:w-8 md:h-8 bg-[#F8F9FA] rounded-full border border-gray-200 shadow-inner"></div>
                                                        <div className="absolute top-0 bottom-0 -translate-x-1/2 border-l-[3px] border-dotted border-gray-300/70 z-[-1]"></div>
                                                        <div className="absolute bottom-0 -translate-x-1/2 translate-y-1/2 w-6 h-6 md:w-8 md:h-8 bg-[#F8F9FA] rounded-full border border-gray-200 shadow-inner"></div>
                                                    </div>

                                                    {/* Right Section (White Ticket Stub) */}
                                                    <div className="w-[110px] sm:w-[120px] md:w-[135px] bg-white flex flex-col items-center justify-between py-4 px-2.5 shrink-0 text-center relative z-10">
                                                        <div className="flex flex-col items-center justify-center w-full my-auto">
                                                            {/* Discount Section */}
                                                            {discount > 0 ? (
                                                                <div className="flex flex-col items-center">
                                                                    <span className="text-[8px] md:text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">
                                                                        Discount
                                                                    </span>
                                                                    <span className="text-xs md:text-sm font-black text-[#2563eb] leading-tight">
                                                                        -{discount}%
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <span className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                                    Special Rate
                                                                </span>
                                                            )}

                                                            <div className="w-7 h-px bg-gray-200 my-2"></div>

                                                            {/* Price Section with IDR first */}
                                                            {discount > 0 && (
                                                                <div className="text-[10px] md:text-[11px] font-medium text-gray-400 line-through leading-none mb-1 whitespace-nowrap">
                                                                    IDR {originalPriceNum.toLocaleString('en-US')}
                                                                </div>
                                                            )}
                                                            <div className="text-xs sm:text-[13px] md:text-sm font-black text-black leading-tight tracking-tight whitespace-nowrap">
                                                                IDR {discount > 0
                                                                    ? `${discountedPriceNum.toLocaleString('en-US')}`
                                                                    : `${originalPriceNum.toLocaleString('en-US')}`}
                                                            </div>
                                                        </div>

                                                        {/* Book Button */}
                                                        <div className="w-full mt-2.5">
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleBookTreatment();
                                                                }}
                                                                className="w-full py-1.5 px-1 bg-black hover:bg-neutral-800 text-white rounded-full text-[9px] md:text-[10px] font-bold tracking-wider uppercase transition-colors shadow-sm flex items-center justify-center gap-1 active:scale-95"
                                                            >
                                                                <span>BOOK</span>
                                                                <ArrowRight size={10} strokeWidth={2.5} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        });
                                    })}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

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
                                            totalPrice: calculateCartTotal(cartItems).total
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
                                                            className="border-t border-border/50 bg-white"
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
                                                                                        isCampaign: false,
                                                                                        massageTable: true,
                                                                                        addons: []
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
                                                                {item.isCampaign && (
                                                                    <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                                                                        <span className="bg-black text-white px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider shadow-sm">
                                                                            {item.campaignTitle}
                                                                        </span>
                                                                        {item.tripOffer ? (
                                                                            <span className="bg-stone-100 text-stone-700 border border-stone-200/80 px-2.5 py-0.5 rounded-full text-[9px] font-medium tracking-wide">
                                                                                {item.tripOffer}
                                                                            </span>
                                                                        ) : null}
                                                                    </div>
                                                                )}
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

                                                        {/* Add-on on left side, Guests Title and counter on right side */}
                                                        <div className="flex items-center justify-between pt-2.5 pb-1 border-t border-border/50">
                                                            <div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setSelectedAddonItem(item)}
                                                                    className="text-[10px] font-bold uppercase tracking-wider text-primary border border-border/80 hover:border-primary px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 bg-stone-50 hover:bg-stone-100 shadow-2xs"
                                                                >
                                                                    <Plus className="w-3 h-3" /> Add-on
                                                                </button>
                                                            </div>
                                                            <div className="flex items-center gap-2.5">
                                                                <span className="text-[10px] font-bold uppercase tracking-widest text-primary/80">Guests</span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const newCart = cartItems.filter(i => i.id !== item.id);
                                                                        setCartItems(newCart);
                                                                        if (newCart.length === 0) {
                                                                            setIsBookingModalOpen(false);
                                                                            setTherapickStep('selection');
                                                                        }
                                                                    }}
                                                                    className="w-7 h-7 rounded-full bg-white border border-border flex items-center justify-center text-text-muted hover:text-red-500 hover:border-red-200 transition-colors shadow-2xs"
                                                                    title="Remove treatment"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                                <div className="w-px h-4 bg-border/60"></div>
                                                                <div className="flex items-center gap-2">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setCartItems(cartItems.map(i => {
                                                                            if (i.id !== item.id) return i;
                                                                            const isCouple = ['couple', 'honeymoon'].some(k => i.title.toLowerCase().includes(k));
                                                                            const step = isCouple ? 2 : 1;
                                                                            return { ...i, guests: Math.max(step, i.guests - step) };
                                                                        }))}
                                                                        className="w-7 h-7 rounded-full bg-white border border-border flex items-center justify-center text-primary hover:bg-border transition-colors shadow-2xs"
                                                                    >
                                                                        <Minus className="w-3 h-3" />
                                                                    </button>
                                                                    <span className="font-bold text-sm text-primary w-4 text-center tabular-nums">{item.guests}</span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setCartItems(cartItems.map(i => {
                                                                            if (i.id !== item.id) return i;
                                                                            const isCouple = ['couple', 'honeymoon'].some(k => i.title.toLowerCase().includes(k));
                                                                            const step = isCouple ? 2 : 1;
                                                                            return { ...i, guests: i.guests + step };
                                                                        }))}
                                                                        className="w-7 h-7 rounded-full bg-white border border-border flex items-center justify-center text-primary hover:bg-border transition-colors shadow-2xs"
                                                                    >
                                                                        <Plus className="w-3 h-3" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
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
                                                <div className="flex items-start justify-between mb-3.5">
                                                    <div>
                                                        <h4 className="text-xs font-bold text-primary uppercase tracking-wider">Massage Table Setup</h4>
                                                        <p className="text-[11px] text-text-muted mt-0.5">
                                                            Select your preferred massage setup at your villa or hotel
                                                        </p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowTableFeeModal(true)}
                                                        className="text-[10px] font-semibold text-primary/80 hover:text-primary transition-colors flex items-center gap-1 bg-stone-100 hover:bg-stone-200/80 px-2.5 py-1 rounded-full shrink-0"
                                                        title="Read why there is an additional fee"
                                                    >
                                                        <Info className="w-3 h-3 text-primary/70" />
                                                        <span>Why a fee?</span>
                                                    </button>
                                                </div>

                                                {/* Table Counter Row - displays ONLY "IDR 100,000 PER TABLE" */}
                                                <div className="flex items-center justify-between p-3.5 rounded-xl bg-stone-50/70 border border-border/60 mb-3">
                                                    <div>
                                                        <div className="font-bold text-xs text-primary">Bring Portable Table</div>
                                                        <div className="text-[11px] text-text-muted mt-0.5 font-medium">
                                                            IDR 100,000 PER TABLE
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
                                                        value={promoCode} onChange={e => {
                                                            setPromoCode(e.target.value.toUpperCase());
                                                            setPromoError(null);
                                                        }}
                                                        disabled={!!appliedPromo}
                                                        className="w-full bg-stone-50/60 border border-border/80 rounded-xl px-4 py-2.5 text-xs text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all uppercase tracking-wider font-medium"
                                                    />
                                                    {appliedPromo ? (
                                                        <button type="button" onClick={() => { setAppliedPromo(null); setPromoCode(''); }} className="px-4 bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors uppercase tracking-wider whitespace-nowrap">
                                                            Remove
                                                        </button>
                                                    ) : (
                                                        <button type="button" onClick={() => {
                                                            const clean = promoCode.trim().toUpperCase();
                                                            if (!clean) return;
                                                            if (clean === 'BALISPA10' || clean === 'VIP10' || clean === 'THERAPICK10') {
                                                                setAppliedPromo(clean);
                                                                setPromoError(null);
                                                            } else {
                                                                setPromoError('Invalid promo code');
                                                            }
                                                        }} disabled={!promoCode.trim()} className="px-5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider whitespace-nowrap">
                                                            Apply
                                                        </button>
                                                    )}
                                                </div>
                                                {promoError && <p className="text-xs text-red-500 mt-1.5 ml-1">{promoError}</p>}
                                                {appliedPromo && <p className="text-xs text-emerald-600 mt-1.5 ml-1">Promo &quot;{appliedPromo}&quot; applied: 10% off</p>}
                                            </div>

                                            {/* Price & Continue */}
                                            <div className="pt-4 border-t border-border/50">
                                                <div className="flex items-end justify-between mb-5">
                                                    <span className="text-xs font-bold text-primary uppercase tracking-widest">Total Price</span>
                                                    <span className="text-2xl font-serif text-primary font-medium">
                                                        IDR {calculateCartTotal(cartItems, appliedPromo || undefined, massageTableCount * 100000).total.toLocaleString('en-US')}
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
                                                            IDR {calculateCartTotal(cartItems, appliedPromo || undefined, massageTableCount * 100000).total.toLocaleString('en-US')}
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
                                                                : 'Standard Setup (No Portable Table)'
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
                                                            IDR {calculateCartTotal(cartItems, appliedPromo || undefined, massageTableCount * 100000).total.toLocaleString('en-US')}
                                                        </span>
                                                    </div>

                                                    <button 
                                                        type="button"
                                                        onClick={() => handleCampaignBooking()}
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
                                                        {item.isCampaign && (
                                                            <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                                                                <span className="bg-black text-white px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider shadow-sm">
                                                                    {item.campaignTitle}
                                                                </span>
                                                                {item.tripOffer ? (
                                                                    <span className="bg-stone-100 text-stone-700 border border-stone-200/80 px-2.5 py-0.5 rounded-full text-[9px] font-medium tracking-wide">
                                                                        {item.tripOffer}
                                                                    </span>
                                                                ) : null}
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
                                                    value={promoCode} onChange={e => {
                                                        setPromoCode(e.target.value.toUpperCase());
                                                        setPromoError(null);
                                                    }}
                                                    disabled={!!appliedPromo}
                                                    className="w-full bg-white border border-border/80 rounded-xl px-4 py-3 text-sm text-primary placeholder:text-text-muted/50 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all uppercase"
                                                />
                                                {appliedPromo ? (
                                                    <button type="button" onClick={() => { setAppliedPromo(null); setPromoCode(''); }} className="px-5 bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors uppercase tracking-wider whitespace-nowrap">
                                                        Remove
                                                    </button>
                                                ) : (
                                                    <button type="button" onClick={() => {
                                                        const clean = promoCode.trim().toUpperCase();
                                                        if (!clean) return;
                                                        if (clean === 'BALISPA10' || clean === 'VIP10' || clean === 'THERAPICK10') {
                                                            setAppliedPromo(clean);
                                                            setPromoError(null);
                                                        } else {
                                                            setPromoError('Invalid promo code');
                                                        }
                                                    }} disabled={!promoCode.trim()} className="px-5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider whitespace-nowrap">
                                                        Apply
                                                    </button>
                                                )}
                                            </div>
                                            {promoError && <p className="text-xs text-red-500 ml-1">{promoError}</p>}
                                            {appliedPromo && <p className="text-xs text-emerald-600 ml-1">Promo &quot;{appliedPromo}&quot; applied: 10% off</p>}
                                        </div>

                                        <div className="mt-8 pt-6 border-t border-border/50">
                                            <div className="flex items-end justify-between mb-6">
                                                <span className="text-xs font-bold text-text-muted uppercase tracking-widest">Total Price</span>
                                                <span className="text-2xl font-serif text-primary">
                                                    IDR {calculateCartTotal(cartItems, appliedPromo || undefined).total.toLocaleString('en-US')}
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
                                                    IDR {calculateCartTotal(cartItems, appliedPromo || undefined).total.toLocaleString('en-US')}
                                                </span>
                                            </div>
                                            <div className="flex flex-col gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => handleCampaignBooking()}
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

            {/* Custom Add-on Treatments Pop-up Modal */}
            <AnimatePresence>
                {selectedAddonItem && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedAddonItem(null)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 15 }}
                            className="relative bg-white rounded-3xl p-5 sm:p-6 shadow-2xl max-w-md w-full max-h-[85vh] flex flex-col z-10 border border-border/80"
                        >
                            {/* Modal Header */}
                            <div className="flex items-start justify-between pb-3.5 border-b border-border/60">
                                <div>
                                    <span className="text-[9px] font-bold tracking-widest text-primary/60 uppercase block mb-1">
                                        Wellness Enhancements
                                    </span>
                                    <h3 className="font-serif text-lg sm:text-xl font-medium text-primary">
                                        Add-On Treatments
                                    </h3>
                                    <p className="text-[11px] text-text-muted mt-0.5">
                                        Enhance your <span className="font-semibold text-primary">{selectedAddonItem.title}</span> ritual
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setSelectedAddonItem(null)}
                                    className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 hover:text-primary flex items-center justify-center transition-colors shrink-0"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="py-4 overflow-y-auto space-y-3 flex-1 no-scrollbar">
                                {availableAddons && availableAddons.length > 0 ? (
                                    availableAddons.map((addon) => {
                                        const isAdded = (selectedAddonItem.addons || []).some((a: any) => a.id === addon.id);
                                        return (
                                            <div 
                                                key={addon.id} 
                                                className={`p-3.5 rounded-2xl border transition-all ${
                                                    isAdded 
                                                        ? 'bg-stone-50/90 border-primary/40 shadow-xs' 
                                                        : 'bg-white border-border/70 hover:border-border'
                                                }`}
                                            >
                                                <div className="flex items-start justify-between gap-3 mb-1.5">
                                                    <div>
                                                        <div className="font-bold text-xs text-primary">{addon.title}</div>
                                                        <div className="text-[10px] text-text-muted flex items-center gap-1 mt-0.5">
                                                            <Clock className="w-3 h-3" />
                                                            <span>{addon.duration}</span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        <div className="font-serif text-xs font-semibold text-primary">
                                                            +IDR {Number(addon.price).toLocaleString('en-US')}
                                                        </div>
                                                    </div>
                                                </div>
                                                {addon.description && (
                                                    <p className="text-[11px] text-stone-600 leading-relaxed mb-3">
                                                        {addon.description}
                                                    </p>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const updatedAddons = isAdded
                                                            ? (selectedAddonItem.addons || []).filter((a: any) => a.id !== addon.id)
                                                            : [...(selectedAddonItem.addons || []), addon];
                                                        
                                                        setCartItems(cartItems.map(i => {
                                                            if (i.id !== selectedAddonItem.id) return i;
                                                            return { ...i, addons: updatedAddons };
                                                        }));

                                                        setSelectedAddonItem({
                                                            ...selectedAddonItem,
                                                            addons: updatedAddons
                                                        });
                                                    }}
                                                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                                                        isAdded
                                                            ? 'bg-stone-200 text-stone-800 hover:bg-red-50 hover:text-red-600'
                                                            : 'bg-primary text-white hover:bg-neutral-800'
                                                    }`}
                                                >
                                                    {isAdded ? (
                                                        <>
                                                            <Check className="w-3.5 h-3.5" /> Added to Treatment (Tap to Remove)
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Plus className="w-3.5 h-3.5" /> Add to Treatment
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="py-6 px-4 text-center space-y-3">
                                        <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto text-primary">
                                            <Sparkles className="w-5 h-5 text-primary/80" />
                                        </div>
                                        <h4 className="font-serif text-base font-semibold text-primary">
                                            Complete Luxury Spa Ritual
                                        </h4>
                                        <p className="text-xs text-text-muted leading-relaxed max-w-xs mx-auto">
                                            Your selected ritual is already fully inclusive with our signature organic aromatherapy oils, customized pressure, and dedicated therapist care.
                                        </p>
                                        <div className="bg-stone-50 border border-border/70 rounded-xl p-3.5 text-[11px] text-stone-600 leading-relaxed text-left">
                                            <span className="font-bold text-primary block mb-0.5">Specialty Enhancements Upon Request</span>
                                            Custom organic facial treatments, herbal body compresses, or extended massage durations can also be arranged directly with your private therapist upon arrival at your villa.
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="pt-3 border-t border-border/60">
                                <button
                                    type="button"
                                    onClick={() => setSelectedAddonItem(null)}
                                    className="w-full bg-black hover:bg-neutral-800 text-white py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-sm"
                                >
                                    Done
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Why a Fee? Pop-up Modal */}
            <AnimatePresence>
                {showTableFeeModal && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowTableFeeModal(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 15 }}
                            className="relative bg-white rounded-3xl p-5 sm:p-6 shadow-2xl max-w-md w-full max-h-[85vh] flex flex-col z-10 border border-border/80"
                        >
                            {/* Modal Header */}
                            <div className="flex items-start justify-between pb-3.5 border-b border-border/60">
                                <div>
                                    <span className="text-[9px] font-bold tracking-widest text-primary/60 uppercase block mb-1">
                                        Equipment & Transport Logistics
                                    </span>
                                    <h3 className="font-serif text-lg sm:text-xl font-medium text-primary">
                                        Why Is There a Table Fee?
                                    </h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowTableFeeModal(false)}
                                    className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 hover:text-primary flex items-center justify-center transition-colors shrink-0"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="py-4 overflow-y-auto space-y-3 flex-1 no-scrollbar text-xs">
                                <div className="p-3.5 rounded-2xl bg-stone-50 border border-border/70 flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-white border border-border/80 flex items-center justify-center shrink-0 text-primary mt-0.5">
                                        <Sparkles className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-xs text-primary uppercase tracking-wider mb-1">
                                            Heavy Commercial Equipment
                                        </h4>
                                        <p className="text-[11px] text-stone-600 leading-relaxed">
                                            Our massage tables are full-length, professional heavy-duty spa tables equipped with adjustable face cradles, luxury padding, and freshly sanitized linens (15–20 kg).
                                        </p>
                                    </div>
                                </div>

                                <div className="p-3.5 rounded-2xl bg-stone-50 border border-border/70 flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-white border border-border/80 flex items-center justify-center shrink-0 text-primary mt-0.5">
                                        <Clock className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-xs text-primary uppercase tracking-wider mb-1">
                                            Independent Scooter Transport
                                        </h4>
                                        <p className="text-[11px] text-stone-600 leading-relaxed">
                                            Therapists commute directly to your villa across Bali on personal motor scooters. Transporting heavy, bulky equipment through Bali traffic, steep inclines, and narrow villa gangways requires careful physical effort and dedicated handling.
                                        </p>
                                    </div>
                                </div>

                                <div className="p-3.5 rounded-2xl bg-stone-50 border border-border/70 flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-white border border-border/80 flex items-center justify-center shrink-0 text-primary mt-0.5">
                                        <Tag className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-xs text-primary uppercase tracking-wider mb-1">
                                            100% Direct Therapist Surcharge
                                        </h4>
                                        <p className="text-[11px] text-stone-600 leading-relaxed">
                                            The surcharge of <strong>IDR 100,000 per table</strong> goes directly to your private therapist to cover physical transportation logistics and on-site setup.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="pt-3 border-t border-border/60">
                                <button
                                    type="button"
                                    onClick={() => setShowTableFeeModal(false)}
                                    className="w-full bg-black hover:bg-neutral-800 text-white py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-sm"
                                >
                                    Understood
                                </button>
                            </div>
                        </motion.div>
                    </div>
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
