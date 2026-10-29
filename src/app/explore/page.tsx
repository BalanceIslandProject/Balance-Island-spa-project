'use client';

import React, { useState, Suspense, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import { Search, Clock, ArrowLeft } from 'lucide-react';
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
        <main className="min-h-screen bg-[#fafafa] pb-20 pt-40 font-sans text-[#171717] antialiased">
            {/* Search & Categories Sticky Header */}
            <div className="fixed top-0 left-0 right-0 z-50 bg-[#fafafa]/95 backdrop-blur-md pt-5 pb-3 border-b border-[#ebebeb]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-3 relative z-30">
                        <div className="flex items-center gap-2.5 w-full">
                            <div className="flex-1 bg-white rounded-[6px] shadow-[0_0_0_1px_rgba(0,0,0,0.04)] border border-[#ebebeb] h-12 flex items-center px-2 hover:border-[#171717] transition-colors">
                                <Link href="/" className="shrink-0 p-2 text-[#666666] hover:text-[#171717] rounded-[6px] transition-colors flex items-center justify-center">
                                    <ArrowLeft className="w-4 h-4" strokeWidth={2} />
                                </Link>
                                <div className="flex flex-col ml-2 flex-1 pr-3 justify-center">
                                    <input 
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder={locationQuery ? `${locationQuery}, Bali` : "Search mobile spa treatments..."}
                                        className="text-xs sm:text-[13px] font-medium text-[#171717] leading-tight bg-transparent border-none outline-none focus:ring-0 placeholder:text-[#888888] w-full p-0 m-0"
                                    />
                                    <span className="text-[10px] sm:text-[11px] text-[#888888] font-mono mt-0.5">
                                        {locationQuery ? `${locationQuery}, Bali` : 'Bali, Indonesia'} • In-Villa Mobile Spa
                                    </span>
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsPriceFilterOpen(!isPriceFilterOpen)}
                                className={`w-12 h-12 rounded-[6px] border flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                                    isPriceFilterOpen ? 'bg-[#171717] text-white border-[#171717]' : 'bg-white text-[#171717] border-[#ebebeb] hover:bg-[#fafafa]'
                                }`}
                                aria-label="Filter by price"
                                title="Filter by price"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                            </button>
                        </div>

                        {/* Price Filter Dropdown */}
                        <AnimatePresence>
                            {isPriceFilterOpen && (
                                <motion.div 
                                    initial={{ opacity: 0, y: -6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -6 }}
                                    className="absolute top-full right-0 mt-2 w-[calc(100%-8px)] mx-1 sm:w-80 bg-white rounded-[6px] p-4 sm:p-5 shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-[#ebebeb] z-30"
                                >
                                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#ebebeb]">
                                        <span className="text-[10px] font-mono uppercase tracking-[0.071em] text-[#666666]">Maximum Price</span>
                                        <span className="text-xs font-mono tabular-nums font-semibold text-[#171717]">IDR {maxPrice.toLocaleString('en-US')}</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="150000" 
                                        max="1500000" 
                                        step="50000"
                                        value={maxPrice}
                                        onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                                        className="w-full accent-[#171717] h-1.5 bg-[#fafafa] rounded-[6px] appearance-none cursor-pointer border border-[#ebebeb]"
                                    />
                                    <div className="flex justify-between text-[10px] text-[#888888] mt-2 font-mono">
                                        <span>IDR 150K</span>
                                        <span>IDR 1.5M</span>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Categories Row */}
                    <div className="flex overflow-x-auto gap-2 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 pt-1 pb-1">
                        {CATEGORIES.map((cat) => {
                            const isActive = activeCategory === cat.id;
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => setActiveCategory(cat.id)}
                                    className={`flex items-center justify-center px-3.5 py-1.5 rounded-[6px] whitespace-nowrap text-xs transition-colors shrink-0 font-mono uppercase tracking-[0.071em] ${
                                        isActive 
                                            ? 'bg-[#171717] text-white font-semibold' 
                                            : 'bg-white text-[#666666] border border-[#ebebeb] hover:text-[#171717] hover:border-[#171717]'
                                    }`}
                                >
                                    <span>{cat.label}</span>
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
                            <h3 className="text-base sm:text-lg font-sans font-medium text-[#171717] tracking-tight">Most Booked</h3>
                        </div>
                        <div className="flex overflow-x-auto gap-4 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 pb-4 snap-x snap-mandatory scroll-reveal-stagger">
                            {treatments.filter(t => t.is_pinned).map(treatment => (
                                <Link href={`/rituals/${createSlug(treatment.title)}`} prefetch={true} key={treatment.id} className="w-[180px] sm:w-[220px] shrink-0 snap-center md:snap-align-none outline-none active:scale-[0.98] transition-all">
                                    <div className="flex flex-col gap-2 group cursor-pointer">
                                        <div className="aspect-[4/3] relative bg-[#fafafa] overflow-hidden rounded-[6px] border border-[#ebebeb] shadow-[0_0_0_1px_rgba(0,0,0,0.02)] group-hover:border-[#171717] transition-colors">
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
                                            <p className="text-[#171717] text-[13px] font-medium">{treatment.title}</p>
                                            <p className="text-[#666666] text-[11px] font-mono mt-0.5"><Clock className="inline w-3 h-3 mr-1 mb-0.5 text-[#888888]"/>{treatment.options[0]?.duration} MINS</p>
                                            <div className="mt-1 flex items-center">
                                                <span className="font-mono tabular-nums font-semibold text-[#171717] text-xs">
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
                        <h3 className="text-base sm:text-lg font-sans font-medium text-[#171717] tracking-tight">Popular Category</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:gap-4 scroll-reveal-stagger">
                        {filteredAndSortedTreatments.map((item) => (
                            <Link href={`/rituals/${createSlug(item.title)}`} prefetch={true} key={item.id} className="w-full block group outline-none active:scale-[0.99] transition-all">
                                <div className="rounded-[6px] bg-white border border-[#ebebeb] flex flex-col h-full relative overflow-hidden p-3.5 sm:p-4 aspect-[4/5] shadow-[0_0_0_1px_rgba(0,0,0,0.02)] hover:border-[#171717] transition-colors cursor-pointer">
                                    <div className="relative z-10 flex flex-col h-full">
                                        <div className="bg-[#fafafa] text-[#171717] border border-[#ebebeb] px-2 py-0.5 rounded-[4px] text-[8px] font-mono font-semibold tracking-[0.071em] uppercase self-start mb-2.5">
                                            {item.category}
                                        </div>
                                        <h4 className="font-medium text-[#171717] text-xs sm:text-[13px] leading-snug mb-1 line-clamp-2">{item.title}</h4>
                                        <p className="text-[10px] text-[#666666] line-clamp-2 mb-auto leading-relaxed font-normal">{item.desc}</p>
                                        
                                        <div className="mt-auto pt-2.5 border-t border-[#ebebeb]">
                                            <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#666666] mb-1.5 uppercase tracking-[0.071em]">
                                                <Clock className="w-3 h-3 text-[#888888]" /> {item.options[0]?.duration} MINS
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="font-mono tabular-nums font-semibold text-[#171717] text-xs">IDR {parseInt(item.options[0]?.price.replace(/,/g, '') || '0').toLocaleString('en-US')}</span>
                                                <div className="w-6 h-6 rounded-[6px] bg-[#171717] text-white flex items-center justify-center shrink-0">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
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
