'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Store, Menu, X, ShoppingBag, CheckCircle2, Clock, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { isCoupleTreatment, getBookingDisplayPrice } from '@/lib/pricingUtils';

export default function TopNav() {
    const pathname = usePathname();
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const { history, removeHistory, triggerRestoreBooking } = useCart();
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [partnerPortalUrl, setPartnerPortalUrl] = useState('https://partners.booktherapick.com');

    const handleRestoreBooking = (booking: any, mode: 'draft' | 'bookAgain') => {
        setIsCartOpen(false);
        triggerRestoreBooking(booking.id, mode);
        if (pathname !== '/') {
            router.push(`/?restoreBooking=${booking.id}&mode=${mode}`);
        }
    };

    useEffect(() => {
        if (typeof window !== 'undefined' && window.location.hostname.includes('localhost')) {
            setPartnerPortalUrl('http://partners.localhost:3000');
        }
    }, []);

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

    const [isPartnersSubdomain, setIsPartnersSubdomain] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined' && window.location.hostname.startsWith('partners.')) {
            setIsPartnersSubdomain(true);
        }
    }, []);

    // Hide TopNav on admin, store, explore, invoice, partners routes, and on partners subdomain
    if (isPartnersSubdomain || pathname?.startsWith('/admin') || pathname?.startsWith('/store') || pathname?.startsWith('/explore') || pathname?.startsWith('/invoice') || pathname?.startsWith('/partners')) {
        return null;
    }

    return (
        <>
        <div className="fixed top-3 sm:top-4 left-0 right-0 z-50 flex justify-center pointer-events-none px-3.5 sm:px-4">
            <header 
                className={`pointer-events-auto flex items-center justify-between relative transition-all duration-300 ease-out will-change-transform
                    w-full max-w-5xl rounded-full px-3.5 sm:px-5 py-2 sm:py-2.5
                    ${isScrolled || isOpen
                        ? 'bg-white/85 saturate-[1.8] backdrop-blur-xl border border-white/70 shadow-[0_8px_30px_rgb(0,0,0,0.08)]' 
                        : 'bg-transparent border-transparent shadow-none'}`} 
                ref={dropdownRef}
                style={{ transformOrigin: 'top center' }}
            >
                {/* Left Section: Therapick Logo (Therapick domain) OR Store Button (Elexoir/Home Spa Ubud) */}
                <div className="flex items-center shrink-0 z-10">
                    {/* Therapick Domain: Logo ONLY (no text title, no divider) */}
                    <Link href="/" className="domain-therapick-only flex items-center group outline-none">
                        <img 
                            src="/therapick-logo-2.png" 
                            alt="Therapick" 
                            className="h-6 sm:h-7 md:h-8 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                        />
                    </Link>

                    {/* Elexoir & Home Spa Ubud: Exact Store Button from Screenshot */}
                    <Link 
                        href="/store" 
                        className="domain-spa-only flex items-center gap-1.5 sm:gap-2 bg-white border border-black/10 shadow-xs rounded-full px-3.5 sm:px-4 h-9 transition-all hover:bg-neutral-50 active:scale-95 text-primary shrink-0"
                    >
                        <Store size={15} strokeWidth={2} className="text-primary" />
                        <span className="text-[10px] sm:text-[11px] font-bold tracking-widest uppercase">
                            STORE
                        </span>
                    </Link>
                </div>

                {/* Center Section: BALI, INDONESIA (Elexoir & Home Spa Ubud only - matches screenshot) */}
                <div className="domain-spa-only absolute left-1/2 -translate-x-1/2 flex items-center justify-center h-full pointer-events-none">
                    <Link href="/" className="pointer-events-auto flex flex-col items-center justify-center leading-none">
                        <span className="text-[11px] sm:text-xs md:text-sm font-sans text-primary tracking-widest font-bold uppercase whitespace-nowrap">
                            BALI, INDONESIA
                        </span>
                    </Link>
                </div>

                {/* Navbar Right Actions: Partner Button, Cart & Dropdown Toggle */}
                <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 z-10">
                    {/* Primary Booking CTA on navbar: exact same size and styling as previous partner button */}
                    <Link
                        href="/explore"
                        className="domain-therapick-only px-3.5 sm:px-4 py-1.5 rounded-full text-[10px] sm:text-[11px] md:text-xs font-bold tracking-[0.08em] uppercase transition-all duration-200 whitespace-nowrap bg-black text-white hover:bg-neutral-800 active:scale-95 shadow-xs border border-black/10"
                    >
                        BOOK NOW
                    </Link>

                    {/* Cart Drawer Trigger with Red Indicator Dot matching screenshot */}
                    <button 
                        onClick={() => setIsCartOpen(true)}
                        className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-primary transition-all duration-200 hover:bg-black/5 active:scale-95 relative border border-black/5 shrink-0"
                        aria-label="Open Cart"
                        title="View Bookings"
                    >
                        <ShoppingBag size={18} strokeWidth={1.8} />
                        {history.length > 0 && (
                            <span className="absolute top-1 right-1 w-2 h-2 bg-[#EF4444] rounded-full ring-2 ring-white"></span>
                        )}
                    </button>

                    {/* Dropdown Menu Toggle (Hamburger / Close) */}
                    <button 
                        onClick={() => setIsOpen(!isOpen)}
                        className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-primary transition-all duration-200 hover:bg-black/5 active:scale-95 border border-black/5 shrink-0"
                        aria-label="Toggle Navigation Menu"
                        title="Menu"
                    >
                        {isOpen ? <X size={19} strokeWidth={2} /> : <Menu size={19} strokeWidth={2} />}
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
                                <a 
                                    href={partnerPortalUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => setIsOpen(false)}
                                    className="flex items-center justify-center w-full px-3.5 py-2.5 rounded-xl text-xs font-bold tracking-wider transition-colors text-white bg-black hover:bg-neutral-800 shadow-sm uppercase"
                                >
                                    PARTNER PORTAL
                                </a>
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
                                    <div 
                                        key={booking.id} 
                                        className="relative w-full flex flex-row rounded-[22px] overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 border border-gray-200/90 bg-[#FAFAFA]"
                                    >
                                        {/* Left Section (Ticket Body) */}
                                        <div className="flex-1 p-3.5 sm:p-4 flex flex-col justify-between bg-[#FAFAFA]">
                                            <div>
                                                {/* Status Badge & Date */}
                                                <div className="flex items-center justify-between gap-2 mb-2">
                                                    {booking.status === 'confirmed' ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 text-[9px] font-bold tracking-wider uppercase border border-emerald-500/20">
                                                            <CheckCircle2 size={10} className="stroke-[2.5]" /> Confirmed
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 text-[9px] font-bold tracking-wider uppercase border border-amber-500/20">
                                                            <Clock size={10} /> Draft Booking
                                                        </span>
                                                    )}
                                                    <span className="text-[9px] text-gray-400 font-medium">
                                                        {new Date(booking.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                                    </span>
                                                </div>

                                                {/* Customer Name */}
                                                {booking.customerDetails?.name && (
                                                    <div className="text-xs font-bold text-gray-900 tracking-tight mb-2 flex items-center gap-1.5">
                                                        <User size={12} className="text-gray-400 shrink-0" />
                                                        <span className="truncate">{booking.customerDetails.name}</span>
                                                    </div>
                                                )}

                                                {/* Treatment List (Treatment Name & Duration) */}
                                                <div className="space-y-1.5 mt-1">
                                                    {booking.items && booking.items.length > 0 ? (
                                                        booking.items.map((item, idx) => (
                                                            <div key={idx} className="bg-white/80 border border-gray-200/70 rounded-xl p-2.5 shadow-2xs">
                                                                <div className="text-xs font-bold text-gray-900 leading-snug line-clamp-1">
                                                                    {item.title}
                                                                </div>
                                                                <div className="flex items-center gap-1.5 mt-1">
                                                                    <span className="inline-flex items-center gap-1 text-[9px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-md border border-primary/10">
                                                                        <Clock size={9} />
                                                                        {String(item.duration).toUpperCase().includes('MIN') ? item.duration : `${item.duration} Mins`}
                                                                    </span>
                                                                    {item.guests > 1 && (
                                                                        <span className="text-[9px] font-semibold text-gray-400">
                                                                            • {isCoupleTreatment(item.title)
                                                                                ? (item.guests === 2 ? '2 Guests (1 Couple)' : `${item.guests} Guests (${Math.round(item.guests / 2)} Couples)`)
                                                                                : `${item.guests} Guests`}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="text-xs text-gray-400 italic">Spa Treatment</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Divider with Cutouts matching Campaign Card */}
                                        <div className="relative w-0 flex flex-col justify-between items-center z-10 shrink-0">
                                            {/* Top Cutout */}
                                            <div className="absolute top-0 -translate-x-1/2 -translate-y-1/2 w-4.5 h-4.5 bg-white rounded-full border border-gray-200/90 shadow-inner"></div>
                                            
                                            {/* Vertical Dashed Line */}
                                            <div className="absolute top-2.5 bottom-2.5 -translate-x-1/2 border-l-[2px] border-dashed border-gray-300/80"></div>

                                            {/* Bottom Cutout */}
                                            <div className="absolute bottom-0 -translate-x-1/2 translate-y-1/2 w-4.5 h-4.5 bg-white rounded-full border border-gray-200/90 shadow-inner"></div>
                                        </div>

                                        {/* Right Section (White Ticket Stub) */}
                                        <div className="w-[105px] sm:w-[115px] bg-white flex flex-col items-center justify-between p-3 shrink-0 text-center relative z-10">
                                            {/* Price */}
                                            <div className="flex flex-col items-center w-full my-auto">
                                                <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">
                                                    Price
                                                </span>
                                                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-tight">
                                                    IDR
                                                </span>
                                                <span className="text-xs sm:text-[13px] font-extrabold text-gray-900 leading-tight">
                                                    {getBookingDisplayPrice(booking).toLocaleString('en-US')}
                                                </span>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex flex-col items-center gap-1.5 w-full mt-2 pt-2 border-t border-gray-100">
                                                {booking.status === 'confirmed' ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRestoreBooking(booking, 'bookAgain')}
                                                        className="w-full py-1.5 px-2 bg-black text-white hover:bg-neutral-800 rounded-full text-[9px] sm:text-[10px] font-bold tracking-wider uppercase transition-all shadow-xs active:scale-95 whitespace-nowrap"
                                                    >
                                                        Book Again
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRestoreBooking(booking, 'draft')}
                                                        className="w-full py-1.5 px-2 bg-black text-white hover:bg-neutral-800 rounded-full text-[9px] sm:text-[10px] font-bold tracking-wider uppercase transition-all shadow-xs active:scale-95 whitespace-nowrap"
                                                    >
                                                        Continue
                                                    </button>
                                                )}

                                                <button 
                                                    type="button"
                                                    onClick={() => removeHistory(booking.id)}
                                                    className="text-[9px] font-bold uppercase tracking-wider text-gray-400 hover:text-red-500 transition-colors"
                                                >
                                                    Remove
                                                </button>
                                            </div>
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
