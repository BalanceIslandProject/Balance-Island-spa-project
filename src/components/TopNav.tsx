'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Store, Menu, X, ShoppingBag, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';

export default function TopNav() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const { history, removeHistory } = useCart();
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Complete navigation items for dropdown
    const navItems = [
        { href: '/', label: 'HOME' },
        { href: '/explore', label: 'TREATMENTS' },
        { href: '/service-areas', label: 'SERVICE AREAS' },
        { href: '/philosophy', label: 'PHILOSOPHY' },
        { href: '/why-choose-us', label: 'WHY CHOOSE US' },
        { href: '/store', label: 'STORE' },
        { href: '/faq', label: 'FAQ' },
        { href: '/contact', label: 'CONTACT' },
    ];

    // Scroll listener for dynamic navbar
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        handleScroll();
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [pathname]);

    // Close dropdown on outside click or route change
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    // Hide TopNav on admin, store, explore, invoice, and partners routes
    if (pathname?.startsWith('/admin') || pathname?.startsWith('/store') || pathname?.startsWith('/explore') || pathname?.startsWith('/invoice') || pathname?.startsWith('/partners')) {
        return null;
    }

    return (
        <>
        <div className="fixed top-0 md:top-5 left-0 right-0 z-50 flex justify-center pointer-events-none md:px-4">
            <header 
                className={`pointer-events-auto flex items-center justify-between relative transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-auto
                    w-[calc(100%-32px)] max-w-6xl rounded-full px-3.5 sm:px-5 py-2 sm:py-2.5 translate-y-4
                    ${isScrolled || isOpen
                        ? 'bg-white/80 saturate-[1.8] backdrop-blur-xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.08)]' 
                        : 'bg-transparent border-transparent shadow-none'}`} 
                ref={dropdownRef}
                style={{ transformOrigin: 'top center' }}
            >
                {/* Brand Identity Display (Left) */}
                <Link href="/" className="flex items-center gap-2.5 shrink-0 group outline-none">
                    {/* Therapick Brand */}
                    <div className="domain-therapick-only flex items-center gap-2 sm:gap-2.5">
                        <img 
                            src="/therapick-logo-2.png" 
                            alt="Therapick" 
                            className="h-6 sm:h-7 md:h-8 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="flex flex-col leading-none border-l border-neutral-300/80 pl-2 sm:pl-2.5 py-0.5">
                            <span className="text-[10px] sm:text-[11px] font-serif tracking-wide text-neutral-900 font-bold">THERAPICK</span>
                            <span className="text-[7px] sm:text-[8px] font-sans font-bold tracking-[0.2em] text-neutral-400 uppercase mt-0.5">BALI, INDONESIA</span>
                        </div>
                    </div>

                    {/* Elexoir Brand */}
                    <div className="domain-ubud-only flex items-center gap-2 sm:gap-2.5">
                        <img 
                            src="/elexoir.png" 
                            alt="Elexoir Home Spa" 
                            className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full object-cover shadow-2xs transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="flex flex-col leading-none">
                            <span className="font-serif text-[13px] sm:text-[14px] md:text-[15px] font-semibold tracking-[0.14em] text-primary">
                                ELEXOIR
                            </span>
                            <span className="text-[7px] sm:text-[8px] font-bold tracking-[0.22em] text-text-muted uppercase mt-0.5">
                                BALI, INDONESIA
                            </span>
                        </div>
                    </div>

                    {/* Home Spa Ubud Brand */}
                    <div className="domain-bali-only flex items-center gap-2 sm:gap-2.5">
                        <img 
                            src="/homespa.png" 
                            alt="Home Spa Ubud" 
                            className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full object-cover shadow-2xs transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="flex flex-col leading-none">
                            <span className="font-serif text-[13px] sm:text-[14px] md:text-[15px] font-semibold tracking-[0.14em] text-primary">
                                HOME SPA
                            </span>
                            <span className="text-[7px] sm:text-[8px] font-bold tracking-[0.22em] text-text-muted uppercase mt-0.5">
                                UBUD, BALI
                            </span>
                        </div>
                    </div>
                </Link>

                {/* Navbar Right Actions: Partner Button, Cart & Dropdown Toggle */}
                <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
                    {/* Strictly shown ONLY on BookTherapick domain: PARTNERS button on navbar */}
                    <Link
                        href="/partners"
                        className={`domain-therapick-only px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-[11px] md:text-xs font-bold tracking-[0.08em] uppercase transition-all duration-200 whitespace-nowrap border ${
                            pathname?.startsWith('/partners')
                                ? 'text-amber-950 bg-amber-500/25 border-amber-500/30 shadow-xs'
                                : 'text-amber-900 bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/20 hover:text-amber-950 active:scale-95'
                        }`}
                    >
                        PARTNERS
                    </Link>

                    {/* Cart Drawer Trigger */}
                    <button 
                        onClick={() => setIsCartOpen(true)}
                        className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-primary transition-all duration-200 hover:bg-black/5 active:scale-95 relative border border-black/5 shrink-0"
                        aria-label="Open Cart"
                        title="View Bookings"
                    >
                        <ShoppingBag size={17} />
                        {history.length > 0 && (
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white"></span>
                        )}
                    </button>

                    {/* Dropdown Menu Toggle (Hamburger / Close) */}
                    <button 
                        onClick={() => setIsOpen(!isOpen)}
                        className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-primary transition-all duration-200 hover:bg-black/5 active:scale-95 border border-black/5 shrink-0"
                        aria-label="Toggle Navigation Menu"
                        title="Menu"
                    >
                        {isOpen ? <X size={19} /> : <Menu size={19} />}
                    </button>
                </div>

                {/* Dropdown Navigation Menu */}
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -8, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -8, scale: 0.97 }}
                            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                            className="absolute top-full right-0 left-0 sm:left-auto sm:w-76 mt-2 p-3 sm:p-3.5 bg-white border border-black/[0.08] shadow-[0_20px_60px_rgba(0,0,0,0.16)] rounded-2xl sm:rounded-3xl flex flex-col gap-1 z-50 overflow-hidden"
                        >
                            {/* Primary Booking CTA */}
                            <Link
                                href="/explore"
                                onClick={() => setIsOpen(false)}
                                className="flex items-center justify-center w-full py-2.5 px-4 mb-1.5 bg-primary text-white hover:bg-black rounded-xl text-xs font-bold tracking-[0.1em] uppercase transition-all shadow-sm active:scale-[0.98]"
                            >
                                Book Now
                            </Link>

                            <div className="h-px bg-black/[0.06] mb-1 -mx-1" />

                            {/* Dropdown Navigation Links */}
                            <div className="flex flex-col gap-0.5">
                                {navItems.map((item) => {
                                    const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                                    return (
                                        <Link 
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setIsOpen(false)}
                                            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-colors ${
                                                isActive 
                                                    ? 'bg-black/5 text-primary' 
                                                    : 'text-text-muted hover:bg-black/[0.04] hover:text-primary'
                                            }`}
                                        >
                                            <span>{item.label}</span>
                                            {isActive && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                                        </Link>
                                    );
                                })}
                            </div>

                            {/* Strictly shown ONLY on BookTherapick domain */}
                            <div className="domain-therapick-only mt-1 pt-1.5 border-t border-black/[0.06]">
                                <Link 
                                    href="/partners"
                                    onClick={() => setIsOpen(false)}
                                    className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold tracking-wider transition-colors text-amber-900 bg-amber-500/10 hover:bg-amber-500/20"
                                >
                                    <span className="uppercase">PARTNER PORTAL</span>
                                    <span className="text-[9px] font-sans font-bold tracking-wide text-amber-800 bg-amber-500/25 px-2 py-0.5 rounded-full uppercase">Affiliates</span>
                                </Link>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </header>
        </div>

        {/* Cart Slide-over Drawer (Preserved completely) */}
        <AnimatePresence>
            {isCartOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsCartOpen(false)}
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60]"
                    />
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-0 right-0 bottom-0 w-full sm:w-[400px] bg-white z-[70] shadow-2xl flex flex-col"
                    >
                        <div className="p-5 flex items-center justify-between border-b border-border/50">
                            <h2 className="font-serif text-lg text-primary tracking-wide font-medium">YOUR BOOKINGS</h2>
                            <button 
                                onClick={() => setIsCartOpen(false)}
                                className="w-8 h-8 rounded-full bg-surface flex items-center justify-center text-text-muted hover:text-primary transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-5 space-y-4">
                            {history.length === 0 ? (
                                <div className="text-center text-text-muted mt-10">
                                    <ShoppingBag size={32} className="mx-auto mb-3 opacity-20" />
                                    <p className="text-sm">No bookings yet.</p>
                                </div>
                            ) : (
                                history.map((booking) => (
                                    <div key={booking.id} className="bg-white border border-border/80 rounded-2xl p-4 shadow-sm relative group">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                {booking.status === 'confirmed' ? (
                                                    <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-emerald-600 mb-1">
                                                        <CheckCircle2 size={10} /> Confirmed
                                                    </span>
                                                ) : (
                                                    <span className="text-[9px] font-bold uppercase tracking-widest text-amber-500 mb-1 block">
                                                        Draft Booking
                                                    </span>
                                                )}
                                                <div className="text-xs font-semibold text-primary">{booking.customerDetails?.name}</div>
                                                <div className="text-[10px] text-text-muted">{new Date(booking.date).toLocaleDateString()}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-serif font-medium text-primary">IDR {booking.totalPrice?.toLocaleString('en-US')}</div>
                                            </div>
                                        </div>
                                        
                                        <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between">
                                            <button 
                                                onClick={() => removeHistory(booking.id)}
                                                className="text-[10px] font-bold uppercase tracking-widest text-text-muted hover:text-red-500 transition-colors"
                                            >
                                                Remove
                                            </button>
                                            
                                            {booking.status === 'confirmed' ? (
                                                <Link 
                                                    href={`/?restoreBooking=${booking.id}`}
                                                    onClick={() => setIsCartOpen(false)}
                                                    className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-primary hover:text-primary/70 transition-colors"
                                                >
                                                    Book Again
                                                </Link>
                                            ) : (
                                                <Link 
                                                    href={`/?restoreBooking=${booking.id}`}
                                                    onClick={() => setIsCartOpen(false)}
                                                    className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-primary hover:text-primary/70 transition-colors"
                                                >
                                                    Continue Booking
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
        </>
    );
}
