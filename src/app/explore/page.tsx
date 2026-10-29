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
        <main className="min-h-screen bg-white pb-20 pt-40 font-sans text-[#171717] antialiased">
            {/* Search & Categories Sticky Header */}
            <div className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md pt-5 pb-3 border-b border-[#E5E5E5]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-3 relative z-30">
                        <div className="flex items-center gap-2.5 w-full">
                            <div className="flex-1 bg-white rounded-xl shadow-2xs border border-[#E5E5E5] h-13 flex items-center px-2 hover:border-[#A3A3A3] transition-colors">
                                <Link href="/" className="shrink-0 p-2 text-[#737373] hover:text-black rounded-lg transition-colors flex items-center justify-center">
                                    <ArrowLeft className="w-5 h-5" strokeWidth={2} />
                                </Link>
                                <div className="flex flex-col ml-2 flex-1 pr-3 justify-center">
                                    <input 
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder={locationQuery ? `${locationQuery}, Bali` : "Search mobile spa treatments..."}
                                        className="text-xs sm:text-[13px] font-semibold text-black leading-tight bg-transparent border-none outline-none focus:ring-0 placeholder:text-[#A3A3A3] w-full p-0 m-0"
                                    />
                                    <span className="text-[10px] sm:text-[11px] text-[#737373] font-medium mt-0.5">
                                        {locationQuery ? `${locationQuery}, Bali` : 'Bali, Indonesia'} • In-Villa Luxury Mobile Spa
                                    </span>
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsPriceFilterOpen(!isPriceFilterOpen)}
                                className={`w-13 h-13 rounded-xl border flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                                    isPriceFilterOpen ? 'bg-black text-white border-black' : 'bg-white text-black border-[#E5E5E5] hover:bg-[#F5F5F5]'
                                }`}
                                aria-label="Filter by price"
                                title="Filter by price"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                            </button>
                        </div>

                        {/* Price Filter Dropdown */}
                        <AnimatePresence>
                            {isPriceFilterOpen && (
                                <motion.div 
                                    initial={{ opacity: 0, y: -6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -6 }}
                                    className="absolute top-full right-0 mt-2 w-[calc(100%-8px)] mx-1 sm:w-80 bg-white rounded-xl p-4 sm:p-5 shadow-lg border border-[#E5E5E5] z-30"
                                >
                                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#E5E5E5]">
                                        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#737373]">Maximum Price</span>
                                        <span className="text-xs font-mono font-semibold text-black">IDR {maxPrice.toLocaleString('en-US')}</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="150000" 
                                        max="1500000" 
                                        step="50000"
                                        value={maxPrice}
                                        onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                                        className="w-full accent-black h-1.5 bg-[#F5F5F5] rounded-lg appearance-none cursor-pointer"
                                    />
                                    <div className="flex justify-between text-[10px] text-[#A3A3A3] mt-2 font-mono">
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
                                    className={`flex items-center justify-center px-3.5 py-1.5 rounded-lg whitespace-nowrap text-xs transition-colors shrink-0 ${
                                        isActive 
                                            ? 'bg-black text-white font-semibold' 
                                            : 'bg-white text-[#737373] border border-[#E5E5E5] hover:text-black hover:border-black font-medium'
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
                            <h3 className="text-lg font-bold text-gray-900 tracking-tight">Most Booked</h3>
                        </div>
                        <div className="flex overflow-x-auto gap-4 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 pb-4 snap-x snap-mandatory scroll-reveal-stagger">
                            {treatments.filter(t => t.is_pinned).map(treatment => (
                                <Link href={`/rituals/${createSlug(treatment.title)}`} prefetch={true} key={treatment.id} className="w-[180px] sm:w-[220px] shrink-0 snap-center md:snap-align-none outline-none active:scale-[0.98] transition-all">
                                    <div className="flex flex-col gap-2 group cursor-pointer">
                                        <div className="aspect-[4/3] relative bg-[#F5F5F5] overflow-hidden rounded-xl border border-[#E5E5E5] shadow-2xs group-hover:border-[#A3A3A3] transition-colors">
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
                                            <p className="text-black text-[13px] font-semibold">{treatment.title}</p>
                                            <p className="text-[#737373] text-[11px] font-medium mt-0.5"><Clock className="inline w-3 h-3 mr-1 mb-0.5 text-[#737373]"/>{treatment.options[0]?.duration} MINS</p>
                                            <div className="mt-1 flex items-center">
                                                <span className="font-mono font-semibold text-black text-xs">
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
                        <h3 className="text-base sm:text-lg font-semibold text-black tracking-tight">Popular Category</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:gap-4 scroll-reveal-stagger">
                        {filteredAndSortedTreatments.map((item) => (
                            <Link href={`/rituals/${createSlug(item.title)}`} prefetch={true} key={item.id} className="w-full block group outline-none active:scale-[0.99] transition-all">
                                <div className="rounded-xl bg-white border border-[#E5E5E5] flex flex-col h-full relative overflow-hidden p-3.5 sm:p-4 aspect-[4/5] shadow-2xs hover:border-black transition-colors cursor-pointer">
                                    <div className="relative z-10 flex flex-col h-full">
                                        <div className="bg-[#FAFAFA] text-black border border-[#E5E5E5] px-2 py-0.5 rounded text-[8px] font-semibold tracking-wider uppercase self-start mb-2.5">
                                            {item.category}
                                        </div>
                                        <h4 className="font-semibold text-black text-xs sm:text-[13px] leading-snug mb-1 line-clamp-2">{item.title}</h4>
                                        <p className="text-[10px] text-[#737373] line-clamp-2 mb-auto leading-relaxed font-normal">{item.desc}</p>
                                        
                                        <div className="mt-auto pt-2.5 border-t border-[#E5E5E5]">
                                            <div className="flex items-center gap-1.5 text-[10px] font-medium text-[#737373] mb-1.5 uppercase tracking-wide">
                                                <Clock className="w-3 h-3 text-[#737373]" /> {item.options[0]?.duration} MINS
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="font-mono font-semibold text-black text-xs">IDR {parseInt(item.options[0]?.price.replace(/,/g, '') || '0').toLocaleString('en-US')}</span>
                                                <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center shrink-0">
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
