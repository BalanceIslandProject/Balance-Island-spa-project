'use client';

import React, { useState, Suspense, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import { Search, Clock, ArrowLeft, X, SlidersHorizontal } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useSpa } from '@/context/SpaContext';
import { createSlug } from '@/utils/slugify';

const CATEGORIES = [
    { id: 'all', label: 'All' },
    { id: 'massage', label: 'Massage' },
    { id: 'package', label: 'Package' },
    { id: 'facial', label: 'Facial' },
    { id: 'treatment', label: 'Treatment' },
];

function ExploreContent() {
    const { treatments } = useSpa();
    const searchParams = useSearchParams();
    const locationQuery = searchParams.get('location') || '';

    const [activeCategory, setActiveCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState(locationQuery || '');
    const [maxPrice, setMaxPrice] = useState(1500000);
    const [isPriceFilterOpen, setIsPriceFilterOpen] = useState(false);

    useEffect(() => {
        if (locationQuery) {
            setSearchQuery(locationQuery);
        }
    }, [locationQuery]);

    const showPinnedTreatments = treatments.some(t => t.is_pinned);

    const filteredAndSortedTreatments = React.useMemo(() => {
        let result = treatments.filter(t => {
            const matchesCategory = activeCategory === 'all' || t.category.toLowerCase() === activeCategory.toLowerCase();
            const isLocationMatch = locationQuery && searchQuery.trim().toLowerCase() === locationQuery.trim().toLowerCase();
            const matchesSearch = !searchQuery.trim() || isLocationMatch || t.title.toLowerCase().includes(searchQuery.toLowerCase()) || t.desc.toLowerCase().includes(searchQuery.toLowerCase());
            
            const getLowestPrice = (options: any[]) => {
                if (!options || options.length === 0) return 0;
                return Math.min(...options.map(o => parseInt(o.price.replace(/,/g, '') || '0')));
            };
            
            const matchesPrice = getLowestPrice(t.options) <= maxPrice;
            
            return matchesCategory && matchesSearch && matchesPrice;
        });

        result.sort((a, b) => {
            const getLowestPrice = (options: any[]) => {
                if (!options || options.length === 0) return 0;
                return Math.min(...options.map(o => parseInt(o.price.replace(/,/g, '') || '0')));
            };
            return getLowestPrice(a.options) - getLowestPrice(b.options);
        });

        return result;
    }, [treatments, activeCategory, searchQuery, maxPrice, locationQuery]);

    return (
        <main className="min-h-screen bg-white pb-20 pt-36">
            {/* Search & Categories Sticky Header */}
            <div className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md pt-5 pb-2.5 border-b border-gray-100 shadow-xs">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-3.5 relative z-30">
                        <div className="flex items-center gap-2.5 w-full">
                            <div className="flex-1 bg-white rounded-full shadow-[0_2px_12px_rgb(0,0,0,0.06)] border border-gray-200/80 h-12 flex items-center px-1.5 hover:shadow-[0_4px_16px_rgb(0,0,0,0.09)] focus-within:border-gray-900/40 focus-within:shadow-[0_4px_18px_rgb(0,0,0,0.1)] transition-all">
                                <Link 
                                    href="/" 
                                    className="w-8 h-8 rounded-full bg-black hover:bg-neutral-800 text-white transition-all flex items-center justify-center shrink-0 shadow-xs active:scale-95 ml-1"
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
                                        placeholder={locationQuery ? `Search in ${locationQuery}...` : "Search treatments or packages..."}
                                        className="text-[13px] font-medium text-gray-900 bg-transparent border-none outline-none focus:ring-0 placeholder:text-gray-400 w-full p-0 m-0"
                                    />
                                    {searchQuery && (
                                        <button
                                            type="button"
                                            onClick={() => setSearchQuery('')}
                                            className="w-5 h-5 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors shrink-0 ml-1"
                                            aria-label="Clear search"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsPriceFilterOpen(!isPriceFilterOpen)}
                                className={`w-12 h-12 rounded-full border shadow-2xs flex items-center justify-center shrink-0 transition-all ${
                                    isPriceFilterOpen 
                                        ? 'bg-[#1D1D1F] text-white border-black shadow-sm' 
                                        : 'bg-white text-gray-700 border-gray-200/90 hover:bg-gray-50 hover:border-gray-300'
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
                                    className="absolute top-full right-0 mt-3 w-[calc(100%-8px)] mx-1 md:w-72 bg-white rounded-2xl p-5 shadow-[0_20px_40px_rgb(0,0,0,0.12)] border border-gray-100 z-30"
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

                    {/* Categories Row */}
                    <div className="flex overflow-x-auto gap-2.5 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 pt-2 pb-1">
                        {CATEGORIES.map((cat) => {
                            const isActive = activeCategory === cat.id;
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => setActiveCategory(cat.id)}
                                    className={`flex items-center justify-center px-4 py-2 rounded-[20px] whitespace-nowrap transition-all duration-300 shrink-0 ${
                                        isActive 
                                            ? 'bg-[#1D1D1F] text-white border border-black' 
                                            : 'bg-white text-gray-700 border border-gray-200/90 hover:border-gray-400 hover:bg-gray-50 active:scale-95'
                                    }`}
                                >
                                    <span className={`text-[13px] ${isActive ? 'font-bold' : 'font-medium'}`}>{cat.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                
                {/* Pinned / Most Booked Treatments (Small Cards) */}
                {showPinnedTreatments && (
                    <section data-reveal className="mb-10 w-full relative z-20 scroll-reveal">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900 tracking-tight">Most Booked</h3>
                        </div>
                        <div className="flex overflow-x-auto gap-4 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 pb-4 snap-x snap-mandatory scroll-reveal-stagger">
                            {treatments.filter(t => t.is_pinned).map(treatment => (
                                <Link href={`/rituals/${createSlug(treatment.title)}`} prefetch={true} key={treatment.id} className="w-[180px] sm:w-[220px] shrink-0 snap-center md:snap-align-none outline-none active:scale-[0.98] transition-all">
                                    <div className="flex flex-col gap-2 group cursor-pointer">
                                        <div className="aspect-[4/3] relative bg-[#F5F5F7] overflow-hidden rounded-2xl shadow-[0_2px_12px_rgb(0,0,0,0.06)] group-hover:shadow-[0_8px_24px_rgb(0,0,0,0.12)] transition-shadow">
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
                                            <p className="text-gray-500 text-[12px] font-medium mt-0.5"><Clock className="inline w-3 h-3 mr-1 mb-0.5 text-gray-400"/>{treatment.options[0]?.duration} MINS</p>
                                            <div className="mt-1 flex items-center">
                                                <span className="font-semibold text-gray-900 text-[13px]">
                                                    IDR {parseInt((treatment.options[0]?.price || '0').replace(/,/g, '')).toLocaleString('en-US')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* Popular Treatments (2-Column Grid) */}
                <section data-reveal className="mb-24 relative group scroll-reveal">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-900 tracking-tight">Popular Category</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-8 scroll-reveal-stagger">
                        {filteredAndSortedTreatments.map((item) => (
                            <Link href={`/rituals/${createSlug(item.title)}`} prefetch={true} key={item.id} className="w-full block group outline-none active:scale-[0.98] transition-all">
                                <div className="rounded-2xl bg-white border border-gray-100 flex flex-col h-full relative overflow-hidden p-4 aspect-[4/5] shadow-[0_2px_12px_rgb(0,0,0,0.04)] hover:shadow-md transition-all cursor-pointer group-hover:-translate-y-1 duration-300">
                                    <div className="relative z-10 flex flex-col h-full">
                                        <div className="bg-white text-gray-800 border border-gray-200 px-2.5 py-1 rounded-full text-[8px] font-bold tracking-widest uppercase self-start mb-3 shadow-sm">
                                            {item.category}
                                        </div>
                                        <h4 className="font-bold text-gray-900 text-[13px] leading-snug mb-1.5 line-clamp-2">{item.title}</h4>
                                        <p className="text-[10px] text-gray-500 line-clamp-2 mb-auto leading-relaxed font-medium">{item.desc}</p>
                                        
                                        <div className="mt-auto pt-3 border-t border-gray-100">
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-800 mb-2 uppercase tracking-widest">
                                                <Clock className="w-3.5 h-3.5 text-gray-500" /> {item.options[0]?.duration} MINS
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="font-semibold text-gray-900 text-[12px]">IDR {parseInt(item.options[0]?.price.replace(/,/g, '') || '0').toLocaleString('en-US')}</span>
                                                <div className="w-7 h-7 rounded-full bg-[#1D1D1F] text-white flex items-center justify-center shrink-0 shadow-sm hover:scale-105 transition-transform">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>

            </div>
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
