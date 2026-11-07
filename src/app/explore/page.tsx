'use client';

import React, { useState, Suspense, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, Clock, ArrowLeft, X, SlidersHorizontal, MapPin, Building2, Plus, ArrowRight, ChevronDown, Check, Home } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useSpa, PartnerTreatment } from '@/context/SpaContext';
import { createSlug } from '@/utils/slugify';
import { parseTreatmentInclusions } from '@/lib/treatmentUtils';
import { isCoupleTreatment } from '@/lib/pricingUtils';

const HOMESPA_CATEGORIES = [
    { id: 'all', label: 'All' },
    { id: 'massage', label: 'Massage' },
    { id: 'package', label: 'Package' },
    { id: 'facial', label: 'Facial' },
    { id: 'treatment', label: 'Treatment' },
];

const PARTNER_CATEGORIES = [
    { id: 'all', label: 'All' },
    { id: 'package', label: 'Package' },
    { id: 'massage', label: 'Massage' },
    { id: 'facial', label: 'Facial' },
    { id: 'body scrub', label: 'Body Scrub' },
];

function ExploreContent() {
    const { treatments, partnerTreatments, siteBrandFilter } = useSpa();
    const searchParams = useSearchParams();
    const router = useRouter();

    const isTherapick = useMemo(() => {
        if (typeof window !== 'undefined') {
            const host = window.location.hostname.toLowerCase();
            if (host.includes('homespaubud') || host.includes('ubudhomespa') || host.includes('elexoir')) {
                return false;
            }
            if (host.includes('therapick') || host.includes('booktherapick')) {
                return true;
            }
        }
        return siteBrandFilter === 'therapick';
    }, [siteBrandFilter]);

    const locationQuery = searchParams.get('location') || '';
    const initialTab = (isTherapick && (searchParams.get('tab') === 'partner' || searchParams.get('type') === 'partner')) ? 'partner' : 'homespa';

    const [activeTab, setActiveTab] = useState<'homespa' | 'partner'>(initialTab);
    const [activeCategory, setActiveCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState(locationQuery || '');
    const [maxPrice, setMaxPrice] = useState(2500000);
    const [isPriceFilterOpen, setIsPriceFilterOpen] = useState(false);
    const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false);

    // Partner Details Modal State
    const [selectedPartnerDetails, setSelectedPartnerDetails] = useState<PartnerTreatment | null>(null);
    const [selectedDetailsDuration, setSelectedDetailsDuration] = useState<string>('');

    // Sync active tab with URL query parameter
    useEffect(() => {
        if (!isTherapick) {
            setActiveTab('homespa');
            return;
        }
        const t = searchParams.get('tab') || searchParams.get('type');
        if (t === 'partner') {
            setActiveTab('partner');
        } else if (t === 'homespa') {
            setActiveTab('homespa');
        }
    }, [searchParams, isTherapick]);

    useEffect(() => {
        if (locationQuery) {
            setSearchQuery(locationQuery);
        }
    }, [locationQuery]);

    // Reset category when switching between Home Spa and Partner Spas
    const handleTabChange = (tab: 'homespa' | 'partner') => {
        if (!isTherapick && tab === 'partner') return;
        setActiveTab(tab);
        setActiveCategory('all');
        setIsServiceDropdownOpen(false);
        const url = new URL(window.location.href);
        url.searchParams.set('tab', tab);
        window.history.replaceState({}, '', url.toString());
    };

    const showPinnedTreatments = (treatments || []).some(t => t.is_pinned);

    // Filtered In-Villa Home Spa Treatments
    const filteredHomeSpaTreatments = useMemo(() => {
        let result = (treatments || []).filter(t => {
            if (!t) return false;
            const matchesCategory = activeCategory === 'all' || (t.category && t.category.toLowerCase() === activeCategory.toLowerCase());
            const isLocationMatch = locationQuery && searchQuery.trim().toLowerCase() === locationQuery.trim().toLowerCase();
            const matchesSearch = !searchQuery.trim() || isLocationMatch || 
                (t.title && t.title.toLowerCase().includes(searchQuery.toLowerCase())) || 
                (t.desc && t.desc.toLowerCase().includes(searchQuery.toLowerCase()));
            
            const getLowestPrice = (options: any[]) => {
                if (!options || options.length === 0) return 0;
                return Math.min(...options.map(o => parseInt(String(o?.price || '0').replace(/[^0-9]/g, '') || '0', 10)));
            };
            
            const matchesPrice = getLowestPrice(t.options) <= maxPrice;
            return matchesCategory && matchesSearch && matchesPrice;
        });

        result.sort((a, b) => {
            const getLowestPrice = (options: any[]) => {
                if (!options || options.length === 0) return 0;
                return Math.min(...options.map(o => parseInt(String(o?.price || '0').replace(/[^0-9]/g, '') || '0', 10)));
            };
            return getLowestPrice(a.options) - getLowestPrice(b.options);
        });

        return result;
    }, [treatments, activeCategory, searchQuery, maxPrice, locationQuery]);

    // Filtered Partner Spa Treatments
    const filteredPartnerTreatments = useMemo(() => {
        if (!isTherapick || !partnerTreatments) return [];
        return partnerTreatments.filter(pt => {
            const matchesCategory = activeCategory === 'all' || (pt.category && pt.category.toLowerCase() === activeCategory.toLowerCase());
            const matchesSearch = !searchQuery.trim() ||
                (pt.title && pt.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (pt.desc && pt.desc.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (pt.partner_name && pt.partner_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (pt.partner_location && pt.partner_location.toLowerCase().includes(searchQuery.toLowerCase()));

            const firstOpt = pt.options?.[0];
            const price = parseInt(String(firstOpt?.price || '0').replace(/[^0-9]/g, '') || '0', 10);
            const matchesPrice = !price || price <= maxPrice;

            return matchesCategory && matchesSearch && matchesPrice;
        });
    }, [isTherapick, partnerTreatments, activeCategory, searchQuery, maxPrice]);

    // Group filtered partner treatments by partner spa
    const partnerGroups = useMemo(() => {
        return filteredPartnerTreatments.reduce((acc: Record<string, { partnerName: string; partnerLogo?: string | null; partnerLocation?: string | null; items: PartnerTreatment[] }>, pt) => {
            const key = pt.partner_id || pt.partner_name || 'partner';
            if (!acc[key]) {
                acc[key] = {
                    partnerName: pt.partner_name,
                    partnerLogo: pt.partner_logo_url,
                    partnerLocation: pt.partner_location,
                    items: []
                };
            }
            acc[key].items.push(pt);
            return acc;
        }, {});
    }, [filteredPartnerTreatments]);

    const activeCategoriesList = activeTab === 'homespa' ? HOMESPA_CATEGORIES : PARTNER_CATEGORIES;

    return (
        <main className="min-h-screen bg-transparent relative overflow-hidden pb-24 pt-28 sm:pt-32">
            {/* Ambient Background Glows matching main website */}
            <div className="fixed top-[-10%] left-1/2 -translate-x-1/2 w-[120%] md:w-[800px] h-[600px] bg-secondary/30 blur-[120px] rounded-full -z-10 pointer-events-none opacity-60 mix-blend-multiply" />
            <div className="fixed top-[15%] right-[-10%] w-[500px] h-[500px] bg-accent/20 blur-[100px] rounded-full -z-10 pointer-events-none opacity-50" />
            <div className="fixed bottom-[10%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/10 blur-[120px] rounded-full -z-10 pointer-events-none opacity-30" />

            {/* Floating Search & Categories Header (Transparent floating design - no background container strip) */}
            <div className="fixed top-0 left-0 right-0 z-50 pt-3.5 pb-2 pointer-events-none">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    
                    {/* Top Row: Back, Search & Price Filter */}
                    <div className="mb-2 relative z-30 pointer-events-auto">
                        <div className="flex items-center gap-2.5 w-full">
                            <div className="flex-1 bg-white/90 backdrop-blur-md rounded-full border border-gray-200/90 h-12 flex items-center px-1.5 focus-within:border-gray-900/40 transition-all shadow-xs">
                                <Link 
                                    href="/" 
                                    className="w-8 h-8 rounded-full bg-black hover:bg-neutral-800 text-white transition-all flex items-center justify-center shrink-0 active:scale-95 ml-1"
                                    aria-label="Back to home"
                                >
                                    <ArrowLeft className="w-4 h-4 text-white" strokeWidth={2.5} />
                                </Link>
                                <div className="flex items-center flex-1 ml-2 mr-2 min-w-0">
                                    <Search className="w-4 h-4 text-gray-400 shrink-0 mr-2" />
                                    <input 
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder={isTherapick && activeTab === 'partner' ? "Search partner spas & packages..." : "Search in-villa massage & spa..."}
                                        className="text-[13px] font-medium text-gray-900 bg-transparent border-none outline-none focus:ring-0 placeholder:text-gray-400 w-full p-0 m-0"
                                    />
                                    {searchQuery && (
                                        <button
                                            type="button"
                                            onClick={() => setSearchQuery('')}
                                            className="w-5 h-5 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors shrink-0 ml-1 cursor-pointer"
                                            aria-label="Clear search"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsPriceFilterOpen(!isPriceFilterOpen)}
                                className={`w-12 h-12 rounded-full border flex items-center justify-center shrink-0 transition-all cursor-pointer shadow-xs ${
                                    isPriceFilterOpen 
                                        ? 'bg-[#1D1D1F] text-white border-black' 
                                        : 'bg-white/90 backdrop-blur-md text-gray-700 border-gray-200/90 hover:bg-white hover:border-gray-400'
                                }`}
                                aria-label="Filter by price"
                            >
                                <SlidersHorizontal className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Price Filter Dropdown */}
                        <AnimatePresence>
                            {isPriceFilterOpen && (
                                <motion.div 
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="absolute top-full right-0 mt-3 w-[calc(100%-8px)] mx-1 md:w-72 bg-white rounded-2xl p-5 shadow-[0_20px_40px_rgb(0,0,0,0.12)] border border-gray-100 z-30 pointer-events-auto"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-primary/80">Max Price</span>
                                        <span className="text-sm font-serif text-primary font-medium">Rp {maxPrice.toLocaleString('en-US')}</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="250000" 
                                        max="3000000" 
                                        step="50000"
                                        value={maxPrice}
                                        onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                                        className="w-full accent-primary h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                    />
                                    <div className="flex justify-between text-[10px] text-gray-400 mt-2 font-medium tracking-wider">
                                        <span>250k</span>
                                        <span>3.0m</span>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Filter Row: Service Toggle Dropdown (Therapick only) + Category Chips */}
                    <div className="flex items-center gap-2 pt-0.5 pb-0.5 pointer-events-auto">
                        
                        {/* Dropdown Toggle: Home Spa / Partner Spas with Notification Badge (Therapick Only) */}
                        {isTherapick && (
                            <>
                                <div className="relative shrink-0 z-30">
                                    <button
                                        type="button"
                                        onClick={() => setIsServiceDropdownOpen(!isServiceDropdownOpen)}
                                        className={`relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold active:scale-95 transition-all cursor-pointer whitespace-nowrap shadow-xs ${
                                            isServiceDropdownOpen
                                                ? 'bg-black text-white border border-black ring-2 ring-black/10'
                                                : 'bg-[#1D1D1F] hover:bg-black text-white border border-black'
                                        }`}
                                        aria-label="Select service mode"
                                    >
                                        <span>{activeTab === 'homespa' ? 'Home Spa' : 'Partner Spas'}</span>
                                        <ChevronDown 
                                            size={13} 
                                            className={`text-gray-400 transition-transform duration-200 ${isServiceDropdownOpen ? 'rotate-180 text-white' : ''}`} 
                                        />

                                        {/* Notification Look for Partner Spas (Floating Red Badge) */}
                                        {partnerTreatments && partnerTreatments.length > 0 && (
                                            <span 
                                                className="absolute -top-1.5 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-[#FF3B30] text-[9px] font-black text-white ring-2 ring-white"
                                                title={`${partnerTreatments.length} partner treatments available`}
                                            >
                                                {partnerTreatments.length}
                                            </span>
                                        )}
                                    </button>

                                    {/* Dropdown Menu Popover */}
                                    <AnimatePresence>
                                        {isServiceDropdownOpen && (
                                            <>
                                                <div 
                                                    className="fixed inset-0 z-40 pointer-events-auto" 
                                                    onClick={() => setIsServiceDropdownOpen(false)} 
                                                />
                                                <motion.div
                                                    initial={{ opacity: 0, y: -6, scale: 0.96 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: -6, scale: 0.96 }}
                                                    transition={{ duration: 0.15 }}
                                                    className="absolute top-full left-0 mt-2 w-56 bg-white/95 backdrop-blur-xl rounded-2xl p-1.5 shadow-[0_12px_36px_rgba(0,0,0,0.18)] border border-gray-100 z-50 overflow-hidden pointer-events-auto"
                                                >
                                                    <div className="px-3 py-1.5 text-[9px] font-bold tracking-widest uppercase text-gray-400 border-b border-gray-100 mb-1">
                                                        Select Service
                                                    </div>

                                                    {/* Option 1: Home Spa */}
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            handleTabChange('homespa');
                                                            setIsServiceDropdownOpen(false);
                                                        }}
                                                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                                            activeTab === 'homespa'
                                                                ? 'bg-[#1D1D1F] text-white'
                                                                : 'text-gray-700 hover:bg-gray-100 hover:text-black'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <Home size={14} className={activeTab === 'homespa' ? 'text-white' : 'text-gray-400'} />
                                                            <span>Home Spa</span>
                                                        </div>
                                                        {activeTab === 'homespa' && <Check size={14} className="text-white" />}
                                                    </button>

                                                    {/* Option 2: Partner Spas */}
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            handleTabChange('partner');
                                                            setIsServiceDropdownOpen(false);
                                                        }}
                                                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer mt-1 ${
                                                            activeTab === 'partner'
                                                                ? 'bg-[#1D1D1F] text-white'
                                                                : 'text-gray-700 hover:bg-gray-100 hover:text-black'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <Building2 size={14} className={activeTab === 'partner' ? 'text-white' : 'text-gray-400'} />
                                                            <span>Partner Spas</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            {partnerTreatments && partnerTreatments.length > 0 && (
                                                                <span className="flex h-4 min-w-[16px] px-1.5 items-center justify-center rounded-full bg-[#FF3B30] text-[9px] font-black text-white">
                                                                    {partnerTreatments.length}
                                                                </span>
                                                            )}
                                                            {activeTab === 'partner' && <Check size={14} className="text-white" />}
                                                        </div>
                                                    </button>
                                                </motion.div>
                                            </>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Subtle Vertical Divider */}
                                <div className="h-5 w-px bg-gray-300/60 shrink-0" />
                            </>
                        )}

                        {/* Category Filter Chips (Starting with All Filter on the Right of Dropdown) */}
                        <div className="flex overflow-x-auto gap-2 no-scrollbar py-0.5 flex-1 min-w-0">
                            {activeCategoriesList.map((cat) => {
                                const isActive = activeCategory === cat.id;
                                return (
                                    <button
                                        key={cat.id}
                                        onClick={() => setActiveCategory(cat.id)}
                                        className={`flex items-center justify-center px-4 py-1.5 rounded-[18px] whitespace-nowrap transition-all duration-200 shrink-0 cursor-pointer shadow-xs ${
                                            isActive 
                                                ? 'bg-[#1D1D1F] text-white border border-black font-bold' 
                                                : 'bg-white/90 backdrop-blur-md text-gray-700 border border-gray-200/90 hover:border-gray-400 hover:bg-white font-medium'
                                        }`}
                                    >
                                        <span className="text-xs">{cat.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                
                {/* ═══════════════════════════════════════════════════════════ */}
                {/* VIEW 1: HOME SPA TREATMENTS                                */}
                {/* ═══════════════════════════════════════════════════════════ */}
                {activeTab === 'homespa' && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25 }}
                    >
                        {/* Pinned / Most Booked Treatments (Small Carousel) */}
                        {showPinnedTreatments && (
                            <section className="mb-10 w-full relative z-20">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">Most Booked</h3>
                                </div>
                                <div className="flex overflow-x-auto gap-4 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 pb-4 snap-x snap-mandatory">
                                    {(treatments || []).filter(t => t.is_pinned).map(treatment => (
                                        <Link href={`/rituals/${createSlug(treatment.title)}`} prefetch={true} key={treatment.id} className="w-[180px] sm:w-[220px] shrink-0 snap-center md:snap-align-none outline-none active:scale-[0.98] transition-all">
                                            <div className="flex flex-col gap-2 group cursor-pointer">
                                                <div className="aspect-[4/3] relative bg-white/70 overflow-hidden rounded-2xl border border-gray-200/80 transition-transform duration-300 group-hover:-translate-y-0.5">
                                                    {treatment.pinned_image ? (
                                                        <Image 
                                                            src={treatment.pinned_image} 
                                                            alt={treatment.title} 
                                                            fill
                                                            sizes="(max-width: 640px) 180px, 220px"
                                                            className="object-cover group-hover:scale-105 transition-transform duration-500" 
                                                        />
                                                    ) : (
                                                        <div className={`w-full h-full bg-gradient-to-br ${treatment.bgPattern} opacity-50`}></div>
                                                    )}
                                                </div>
                                                <div className="flex flex-col px-1 pt-1">
                                                    <p className="text-gray-900 text-[14px] font-bold">{treatment.title}</p>
                                                    <p className="text-gray-500 text-[12px] font-medium mt-0.5">
                                                        <Clock className="inline w-3 h-3 mr-1 mb-0.5 text-gray-400"/>
                                                        {treatment.options[0]?.duration} MINS
                                                    </p>
                                                    <div className="mt-1 flex items-center">
                                                        <span className="font-semibold text-gray-900 text-[13px]">
                                                            IDR {parseInt(String(treatment.options[0]?.price || '0').replace(/[^0-9]/g, '') || '0', 10).toLocaleString('en-US')}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Popular In-Villa Treatments (2-Column Grid) */}
                        <section className="mb-24 relative group">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
                                    All Treatments ({filteredHomeSpaTreatments.length})
                                </h3>
                            </div>

                            {filteredHomeSpaTreatments.length === 0 ? (
                                <div className="p-12 text-center bg-gray-50 rounded-3xl border border-gray-100">
                                    <p className="text-sm text-gray-500 font-medium">No in-villa treatments match your search or price filter.</p>
                                    <button
                                        type="button"
                                        onClick={() => { setSearchQuery(''); setActiveCategory('all'); setMaxPrice(2500000); }}
                                        className="mt-4 px-5 py-2 bg-black text-white text-xs font-bold rounded-full cursor-pointer"
                                    >
                                        Reset Filters
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                                    {filteredHomeSpaTreatments.map((item) => (
                                        <Link href={`/rituals/${createSlug(item.title)}`} prefetch={true} key={item.id} className="w-full block group outline-none active:scale-[0.98] transition-all">
                                            <div className="rounded-2xl bg-white/90 backdrop-blur-xs border border-gray-200/80 flex flex-col h-full relative overflow-hidden p-4 transition-all cursor-pointer group-hover:-translate-y-1 duration-300">
                                                <div className="relative z-10 flex flex-col h-full">
                                                    <div className="bg-white text-gray-800 border border-gray-200 px-2.5 py-1 rounded-full text-[8px] font-bold tracking-widest uppercase self-start mb-3">
                                                        {item.category}
                                                    </div>
                                                    <h4 className="font-bold text-gray-900 text-[13px] sm:text-[14px] leading-snug mb-1.5 line-clamp-2">{item.title}</h4>
                                                    <p className="text-[10px] sm:text-[11px] text-gray-500 line-clamp-2 mb-auto leading-relaxed font-light">{item.desc}</p>
                                                    
                                                    <div className="mt-4 pt-3 border-t border-gray-100">
                                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-700 mb-2 uppercase tracking-widest">
                                                            <Clock className="w-3.5 h-3.5 text-gray-400" /> {item.options[0]?.duration} MINS
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <span className="font-bold text-gray-900 text-[13px]">
                                                                IDR {parseInt(String(item.options[0]?.price || '0').replace(/[^0-9]/g, '') || '0', 10).toLocaleString('en-US')}
                                                            </span>
                                                            <div className="w-7 h-7 rounded-full bg-[#1D1D1F] text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                                                <Plus size={14} strokeWidth={2.5} />
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
                    </motion.div>
                )}

                {/* ═══════════════════════════════════════════════════════════ */}
                {/* VIEW 2: PARTNER SPAS & DESTINATION CENTERS (Therapick Only) */}
                {/* ═══════════════════════════════════════════════════════════ */}
                {isTherapick && activeTab === 'partner' && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25 }}
                    >
                        {filteredPartnerTreatments.length === 0 ? (
                            <div className="p-12 text-center bg-gray-50 rounded-3xl border border-gray-100">
                                <p className="text-sm text-gray-500 font-medium">No partner spa treatments match your search or price filter.</p>
                                <button
                                    type="button"
                                    onClick={() => { setSearchQuery(''); setActiveCategory('all'); setMaxPrice(2500000); }}
                                    className="mt-4 px-5 py-2 bg-black text-white text-xs font-bold rounded-full cursor-pointer"
                                >
                                    Reset Filters
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-12">
                                {Object.entries(partnerGroups).map(([partnerKey, group]) => (
                                    <div key={partnerKey} className="space-y-4">
                                        {/* Partner Spa Header */}
                                        <div className="flex items-center gap-3.5 px-1">
                                            {group.partnerLogo ? (
                                                <img
                                                    src={group.partnerLogo}
                                                    alt={group.partnerName}
                                                    className="w-12 h-12 rounded-2xl object-cover border border-gray-200/90 bg-white shrink-0"
                                                />
                                            ) : (
                                                <div className="w-12 h-12 rounded-2xl bg-[#1D1D1F] text-white flex items-center justify-center font-bold text-base shrink-0">
                                                    {group.partnerName?.charAt(0) || 'P'}
                                                </div>
                                            )}
                                            <div>
                                                <h4 className="text-base sm:text-lg font-bold text-gray-900 leading-tight">
                                                    {group.partnerName}
                                                </h4>
                                                {group.partnerLocation && (
                                                    <span className="text-xs text-gray-500 font-medium flex items-center gap-1 mt-0.5">
                                                        <MapPin size={12} className="text-gray-400 shrink-0" />
                                                        {group.partnerLocation}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Partner Treatment Cards Grid */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                            {group.items.map((pt) => {
                                                const opts = Array.isArray(pt.options) && pt.options.length > 0 ? pt.options : [{ duration: '60', price: '450,000' }];
                                                const firstOpt = opts[0];
                                                const basePublishedPrice = parseInt(String(firstOpt?.price || '0').replace(/[^0-9]/g, '') || '0', 10);
                                                const discountRate = Number(pt.partner_discount_percentage) || 0;
                                                const discountAmount = discountRate > 0 ? Math.round(basePublishedPrice * (discountRate / 100)) : 0;
                                                const subtotalPrice = basePublishedPrice - discountAmount;

                                                return (
                                                    <div
                                                        key={pt.id}
                                                        onClick={() => {
                                                            setSelectedDetailsDuration(firstOpt.duration);
                                                            setSelectedPartnerDetails(pt);
                                                        }}
                                                        className="group relative rounded-[28px] border border-gray-200/90 bg-white/90 backdrop-blur-xs overflow-hidden transition-all duration-300 flex flex-col justify-between cursor-pointer active:scale-[0.99]"
                                                    >
                                                        <div>
                                                            {/* Treatment Cover Photo */}
                                                            <div className="relative h-44 sm:h-48 w-full bg-gray-100 overflow-hidden">
                                                                {pt.image_url ? (
                                                                    <img
                                                                        src={pt.image_url}
                                                                        alt={pt.title}
                                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                                        loading="lazy"
                                                                    />
                                                                ) : (
                                                                    <div className="w-full h-full flex flex-col items-center justify-center bg-linear-to-br from-gray-100 to-gray-200 text-gray-400 gap-2">
                                                                        <Building2 size={32} strokeWidth={1.5} className="text-gray-300" />
                                                                        <span className="text-[11px] font-semibold tracking-wider uppercase text-gray-400">{pt.partner_name}</span>
                                                                    </div>
                                                                )}

                                                                {/* Category Floating Pill */}
                                                                <div className="absolute top-3 left-3 z-10">
                                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md text-white text-[9px] font-bold tracking-wider uppercase">
                                                                        {pt.category || 'Package'}
                                                                    </span>
                                                                </div>

                                                                {/* Discount Badge */}
                                                                {discountRate > 0 && (
                                                                    <div className="absolute top-3 right-3 z-10">
                                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-black tracking-wide">
                                                                            {discountRate}% OFF
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Card Content Body */}
                                                            <div className="p-4 sm:p-5">
                                                                <h4 className="text-base sm:text-lg font-bold text-gray-900 leading-snug tracking-tight mb-1.5 group-hover:text-black transition-colors">
                                                                    {pt.title}
                                                                </h4>

                                                                {pt.desc && (
                                                                    <p className="text-xs text-gray-500 font-light line-clamp-2 leading-relaxed mb-4">
                                                                        {pt.desc.split(/What's Included/i)[0].trim()}
                                                                    </p>
                                                                )}

                                                                {/* Duration pills */}
                                                                <div className="flex flex-wrap gap-1.5 mb-2">
                                                                    {opts.map((opt: any, oIdx: number) => (
                                                                        <span
                                                                            key={oIdx}
                                                                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-gray-100 text-gray-700 text-[10px] font-bold uppercase tracking-wider"
                                                                        >
                                                                            <Clock size={10} className="text-gray-500" />
                                                                            {String(opt.duration).toUpperCase().includes('MIN') ? opt.duration : `${opt.duration} MINS`}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Bottom Customer Rate & Plus Action */}
                                                        <div className="p-4 sm:p-5 pt-0 mt-auto">
                                                            <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-3">
                                                                <div>
                                                                    <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 block">Customer Rate</span>
                                                                    <div className="flex items-baseline gap-2">
                                                                        <span className="text-base font-bold text-gray-900">
                                                                            IDR {subtotalPrice.toLocaleString('en-US')}
                                                                        </span>
                                                                        {discountRate > 0 && (
                                                                            <span className="text-xs text-gray-400 line-through">
                                                                                IDR {basePublishedPrice.toLocaleString('en-US')}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                <div
                                                                    className="w-10 h-10 rounded-full bg-[#1D1D1F] group-hover:bg-black text-white flex items-center justify-center transition-all group-hover:scale-105 shrink-0"
                                                                    title="View treatment details"
                                                                >
                                                                    <Plus size={20} strokeWidth={2.5} />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}

            </div>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* FULL SCREEN POP-UP MODAL FOR PARTNER TREATMENT DETAILS         */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <AnimatePresence>
                {selectedPartnerDetails && (() => {
                    const pt = selectedPartnerDetails;
                    const opts = Array.isArray(pt.options) && pt.options.length > 0 ? pt.options : [{ duration: '60', price: '450,000' }];
                    const firstOpt = opts[0];
                    const chosenDur = selectedDetailsDuration || opts[0].duration;
                    const currentOpt = opts.find((o: any) => o.duration === chosenDur) || opts[0];
                    const basePublishedPrice = parseInt(String(currentOpt?.price || '0').replace(/[^0-9]/g, '') || '0', 10);
                    const discountRate = Number(pt.partner_discount_percentage) || 0;
                    const discountAmount = discountRate > 0 ? Math.round(basePublishedPrice * (discountRate / 100)) : 0;
                    const subtotalPrice = basePublishedPrice - discountAmount;
                    const isCouple = isCoupleTreatment(pt.title);

                    // Robust parsing of treatment inclusions and description
                    const { descClean, inclusions } = parseTreatmentInclusions(pt.desc);

                    const handleBookPartner = () => {
                        setSelectedPartnerDetails(null);
                        router.push(`/?bookPartner=${pt.id}&duration=${chosenDur}`);
                    };

                    return (
                        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-0 md:p-4 bg-black/60 backdrop-blur-xs">
                            <motion.div
                                initial={{ y: '100%', opacity: 0.8 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: '100%', opacity: 0 }}
                                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                                className="w-full h-[100dvh] md:h-auto md:max-h-[92vh] md:max-w-2xl bg-white rounded-none md:rounded-[32px] p-5 sm:p-7 shadow-2xl border border-gray-100 flex flex-col text-black overflow-y-auto no-scrollbar"
                                style={{ backgroundColor: '#ffffff', opacity: 1 }}
                            >
                                {/* Modal Header: Partner Identity */}
                                <div className="flex items-center justify-between pb-4 border-b border-gray-100 shrink-0">
                                    <div className="flex items-center gap-3">
                                        {pt.partner_logo_url ? (
                                            <img
                                                src={pt.partner_logo_url}
                                                alt={pt.partner_name}
                                                className="w-11 h-11 rounded-2xl object-cover border border-gray-200/90 bg-white shadow-xs shrink-0"
                                            />
                                        ) : (
                                            <div className="w-11 h-11 rounded-2xl bg-[#1D1D1F] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                                                {pt.partner_name?.charAt(0) || 'P'}
                                            </div>
                                        )}
                                        <div>
                                            <h3 className="font-bold text-sm text-gray-900 leading-tight">
                                                {pt.partner_name}
                                            </h3>
                                            {pt.partner_location && (
                                                <span className="text-[11px] text-gray-500 font-medium flex items-center gap-1 mt-0.5">
                                                    <MapPin size={11} className="text-gray-400 shrink-0" />
                                                    {pt.partner_location}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setSelectedPartnerDetails(null)}
                                        className="w-9 h-9 rounded-full bg-gray-100 hover:bg-black hover:text-white flex items-center justify-center text-gray-600 transition-colors cursor-pointer"
                                        title="Close"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>

                                {/* Body */}
                                <div className="py-4 space-y-4 flex-1">
                                    {/* Treatment Image */}
                                    {pt.image_url && (
                                        <div className="relative h-52 sm:h-64 w-full rounded-2xl overflow-hidden bg-gray-100 shadow-xs">
                                            <img
                                                src={pt.image_url}
                                                alt={pt.title}
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute top-3 left-3">
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md text-white text-[9px] font-bold tracking-wider uppercase">
                                                    {pt.category || 'Package'}
                                                </span>
                                            </div>
                                            {discountRate > 0 && (
                                                <div className="absolute top-3 right-3">
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-black tracking-wide shadow-xs">
                                                        {discountRate}% OFF
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Title, Category & Duration */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-primary/70">
                                                {pt.category || 'Package'}
                                            </span>
                                            {isCouple && (
                                                <span className="text-[9px] font-bold uppercase tracking-wider bg-rose-50 text-rose-600 px-2.5 py-0.5 rounded-full border border-rose-100">
                                                    Couple Ritual
                                                </span>
                                            )}
                                        </div>
                                        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
                                            {pt.title}
                                        </h2>
                                        {/* Duration displayed cleanly below treatment name */}
                                        <div className="flex items-center gap-2 mt-2">
                                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gray-100 text-gray-800 text-xs font-bold uppercase tracking-wider">
                                                <Clock size={12} className="text-gray-500" />
                                                <span>{String(chosenDur || firstOpt?.duration || '').replace(/mins?/gi, '').trim()} Mins</span>
                                            </div>
                                            {opts.length > 1 && (
                                                <div className="flex items-center gap-1.5">
                                                    {opts.map((opt: any, idx: number) => {
                                                        const isSelected = chosenDur === opt.duration;
                                                        const optDur = String(opt.duration).replace(/mins?/gi, '').trim();
                                                        return (
                                                            <button
                                                                key={idx}
                                                                type="button"
                                                                onClick={() => setSelectedDetailsDuration(opt.duration)}
                                                                className={`text-xs font-bold px-2.5 py-1 rounded-xl border transition-all cursor-pointer ${
                                                                    isSelected
                                                                        ? 'bg-[#1D1D1F] text-white border-[#1D1D1F] shadow-xs'
                                                                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                                                }`}
                                                            >
                                                                {optDur} Mins
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Description */}
                                    {descClean && (
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Experience</span>
                                            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-light">
                                                {descClean}
                                            </p>
                                        </div>
                                    )}

                                    {/* Treatment Inclusions Table with Bold Title */}
                                    {inclusions.length > 0 && (
                                        <div className="space-y-2 pt-1">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-xs font-black uppercase tracking-wider text-gray-900 flex items-center gap-1.5">
                                                    <span>Treatment Inclusions</span>
                                                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                                        {inclusions.length} {inclusions.length === 1 ? 'Step' : 'Steps'} Included
                                                    </span>
                                                </h4>
                                            </div>

                                            {/* Step-by-Step Breakdown Table */}
                                            <div className="rounded-2xl border border-gray-200/90 bg-gray-50/70 overflow-hidden divide-y divide-gray-100">
                                                {inclusions.map((inc, i) => (
                                                    <div
                                                        key={i}
                                                        className="flex items-center justify-between p-3 sm:p-3.5 hover:bg-white transition-colors gap-3"
                                                    >
                                                        <div className="flex items-center gap-2.5 min-w-0">
                                                            <div className="w-6 h-6 rounded-lg bg-black text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                                                                {i + 1}
                                                            </div>
                                                            <span className="text-xs sm:text-sm font-bold text-gray-900 leading-snug">
                                                                {inc.name}
                                                            </span>
                                                        </div>
                                                        {inc.duration && (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-gray-700 text-[10px] sm:text-xs font-bold uppercase tracking-wider shrink-0 shadow-xs">
                                                                <Clock size={11} className="text-gray-400" />
                                                                {inc.duration}
                                                            </span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Modal Footer with Customer Rate (Strictly One Line) & Book Treatment CTA */}
                                <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-3 mt-auto shrink-0 bg-white">
                                    <div className="shrink-0 min-w-0 pr-2">
                                        <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">Customer Rate</span>
                                        <div className="flex items-baseline gap-2 whitespace-nowrap">
                                            <span className="text-base sm:text-xl font-black text-gray-900 whitespace-nowrap">
                                                IDR {subtotalPrice.toLocaleString('en-US')}
                                            </span>
                                            {discountRate > 0 && (
                                                <span className="text-xs text-gray-400 line-through whitespace-nowrap">
                                                    IDR {basePublishedPrice.toLocaleString('en-US')}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleBookPartner}
                                        className="py-3.5 px-6 sm:px-7 rounded-full bg-[#1D1D1F] hover:bg-black text-white text-xs sm:text-sm font-bold transition-all shadow-md active:scale-95 flex items-center gap-2 shrink-0 cursor-pointer whitespace-nowrap"
                                    >
                                        <span>Book Treatment</span>
                                        <ArrowRight size={15} />
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    );
                })()}
            </AnimatePresence>
        </main>
    );
}

export default function Explore() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-white pb-20 pt-40 flex items-center justify-center"><div className="w-8 h-8 rounded-full border-4 border-gray-200 border-t-primary animate-spin"></div></div>}>
            <ExploreContent />
        </Suspense>
    );
}
