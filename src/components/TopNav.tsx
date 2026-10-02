'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Store, Menu, X, ShoppingBag, FileText, CheckCircle2 } from 'lucide-react';
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

    const desktopNavItems = [
        { href: '/', label: 'HOME' },
        { href: '/store', label: 'STORE' },
        { href: '/rituals', label: 'TREATMENT' },
        { href: '/contact', label: 'CONTACT' },
    ];

    const mobileNavItems = [
        { href: '/', label: 'HOME' },
        { href: '/philosophy', label: 'PHILOSOPHY' },
        { href: '/why-choose-us', label: 'WHY CHOOSE US' },
        { href: '/service-areas', label: 'SERVICE AREAS' },
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
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Hide TopNav on admin, store, and explore routes
    if (pathname?.startsWith('/admin') || pathname?.startsWith('/store') || pathname?.startsWith('/explore')) {
        return null;
    }

    return (
        <>
        <div className="fixed top-0 md:top-6 left-0 right-0 z-50 flex justify-center pointer-events-none md:px-4">
            <header 
                className={`pointer-events-auto flex items-center justify-between relative transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-auto
                    w-[calc(100%-32px)] max-w-6xl rounded-[32px] md:rounded-full px-4 py-2 md:py-3 translate-y-4
                    ${isScrolled 
                        ? 'bg-white/70 saturate-[1.8] backdrop-blur-xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.08)]' 
                        : 'bg-transparent border-transparent shadow-none'}`} 
                ref={dropdownRef}
                style={{ transformOrigin: 'top center' }}
            >
                
                {/* Brand / Store (Left) */}
                <Link href="/store" className="flex items-center gap-2 bg-white/20 backdrop-blur-md border border-white/30 shadow-sm rounded-full pl-3 pr-4 h-9 transition-colors hover:bg-white/30 text-primary shrink-0">
                    <Store size={16} strokeWidth={2.5} />
                    <span className="text-[10px] md:text-[11px] font-bold tracking-widest uppercase mt-0.5">
                        STORE
                    </span>
                </Link>

                {/* Location Title (Center) */}
                <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center h-full">
                    <Link href="/" className="flex flex-col items-center justify-center leading-none">
                        <span className="text-[12px] md:text-[14px] font-serif text-primary tracking-widest font-bold uppercase mt-0.5">BALI, INDONESIA</span>
                    </Link>
                </div>

                {/* Desktop Inline Links (Always visible on desktop) */}
                <nav className={`hidden md:flex items-center gap-4 md:gap-8`}>
                    {desktopNavItems.map((item) => {
                        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                        return (
                            <Link 
                                key={item.href}
                                href={item.href} 
                                className={`text-[11px] md:text-[13px] font-semibold tracking-wider transition-colors whitespace-nowrap ${
                                    isActive ? 'text-primary' : 'text-primary/60 hover:text-primary'
                                }`}
                            >
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
                <button 
                    onClick={() => setIsCartOpen(true)}
                    className="hidden md:flex w-9 h-9 rounded-full items-center justify-center text-primary transition-colors hover:bg-black/5 relative shrink-0"
                    aria-label="Open Cart"
                >
                    <ShoppingBag size={18} />
                    {history.length > 0 && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                    )}
                </button>

                
                <div className="flex items-center gap-2 shrink-0 md:hidden">
                    <button 
                        onClick={() => setIsCartOpen(true)}
                        className="w-9 h-9 rounded-full flex items-center justify-center text-primary transition-colors hover:bg-black/5 relative"
                        aria-label="Open Cart"
                    >
                        <ShoppingBag size={18} />
                        {history.length > 0 && (
                            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                        )}
                    </button>
                    {/* Dropdown Toggle Button (Visible on mobile ALWAYS) */}
                <button 
                    onClick={() => setIsOpen(!isOpen)}
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-primary transition-colors hover:bg-black/5 shrink-0 md:hidden`}
                    aria-label="Toggle Navigation"
                >
                    {isOpen ? <X size={18} /> : <Menu size={18} />}
                </button>

                </div>

                {/* Dropdown Menu (Mobile Only) */}
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className={`absolute top-[120%] right-0 w-48 shadow-[0_20px_40px_rgb(0,0,0,0.08)] overflow-hidden flex flex-col p-2 bg-white/95 backdrop-blur-3xl border border-border/30 rounded-2xl z-50 md:hidden`}
                        >
                            {mobileNavItems.map((item) => {
                                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                                return (
                                    <Link 
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setIsOpen(false)}
                                        className={`px-4 py-3 rounded-xl text-xs font-bold tracking-wider transition-colors ${
                                            isActive 
                                                ? 'bg-surface text-primary' 
                                                : 'text-text-muted hover:bg-surface/50 hover:text-primary'
                                        }`}
                                    >
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </motion.div>
                    )}
                </AnimatePresence>

            </header>
        </div>

        {/* Cart Slide-over */}
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
                                                    href="/store"
                                                    onClick={() => setIsCartOpen(false)}
                                                    className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-primary hover:text-primary/70 transition-colors"
                                                >
                                                    <Store size={12} /> Book Again
                                                </Link>
                                            ) : (
                                                <Link 
                                                    href="/checkout"
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
