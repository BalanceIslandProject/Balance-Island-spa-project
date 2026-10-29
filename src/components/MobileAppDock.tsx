'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, Compass, ShoppingBag, MessageCircle } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useSpa } from '@/context/SpaContext';

export default function MobileAppDock() {
  const pathname = usePathname();
  const { history, isCartOpen, setIsCartOpen } = useCart();
  const { siteBrandFilter } = useSpa();

  // Hidden on admin, partner portal, invoice views, or ritual detail pages (which have dedicated sticky booking bar)
  if (
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/partners') ||
    pathname?.startsWith('/invoice') ||
    pathname?.startsWith('/rituals')
  ) {
    return null;
  }

  const isHomeActive = pathname === '/';
  const isExploreActive = pathname?.startsWith('/explore') || pathname?.startsWith('/rituals');

  // WhatsApp concierge number
  const waNumber = siteBrandFilter === 'therapick' ? '6281353526615' : '6281353526615';
  const waMessage = encodeURIComponent('Hello Therapick Concierge, I would like to inquire about luxury in-villa spa treatments.');

  return (
    <div 
      data-app-dock
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 pointer-events-none px-3.5 pb-[max(0.65rem,env(safe-area-inset-bottom))] pt-2"
    >
      <nav 
        aria-label="Mobile Navigation"
        className="pointer-events-auto max-w-sm mx-auto bg-white/92 saturate-[1.8] backdrop-blur-2xl border border-black/[0.08] shadow-[0_12px_36px_rgba(0,0,0,0.12)] rounded-full px-2 py-1.5 flex items-center justify-between"
      >
        {/* Discover / Home */}
        <Link
          href="/"
          className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-full transition-all duration-150 active:scale-95 ${
            isHomeActive 
              ? 'text-primary font-bold' 
              : 'text-text-muted hover:text-primary font-medium'
          }`}
        >
          <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
            isHomeActive ? 'bg-black text-white shadow-xs' : 'bg-transparent text-current'
          }`}>
            <Compass size={17} strokeWidth={isHomeActive ? 2.4 : 1.9} />
          </div>
          <span className="text-[9px] uppercase tracking-wider mt-0.5 leading-none">
            Discover
          </span>
        </Link>

        {/* Treatments / Explore */}
        <Link
          href="/explore"
          className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-full transition-all duration-150 active:scale-95 ${
            isExploreActive 
              ? 'text-primary font-bold' 
              : 'text-text-muted hover:text-primary font-medium'
          }`}
        >
          <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
            isExploreActive ? 'bg-black text-white shadow-xs' : 'bg-transparent text-current'
          }`}>
            <Sparkles size={16} strokeWidth={isExploreActive ? 2.4 : 1.9} />
          </div>
          <span className="text-[9px] uppercase tracking-wider mt-0.5 leading-none">
            Rituals
          </span>
        </Link>

        {/* Bookings / Cart Drawer */}
        <button
          type="button"
          onClick={() => setIsCartOpen(true)}
          className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-full transition-all duration-150 active:scale-95 relative ${
            isCartOpen 
              ? 'text-primary font-bold' 
              : 'text-text-muted hover:text-primary font-medium'
          }`}
        >
          <div className={`w-8 h-8 rounded-full flex items-center justify-center relative transition-colors ${
            isCartOpen ? 'bg-black text-white shadow-xs' : 'bg-transparent text-current'
          }`}>
            <ShoppingBag size={16} strokeWidth={isCartOpen ? 2.4 : 1.9} />
            {history.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[15px] h-[15px] px-1 bg-red-500 text-white rounded-full text-[9px] font-bold tabular-nums flex items-center justify-center ring-2 ring-white">
                {history.length}
              </span>
            )}
          </div>
          <span className="text-[9px] uppercase tracking-wider mt-0.5 leading-none">
            Bookings
          </span>
        </button>

        {/* WhatsApp Concierge */}
        <a
          href={`https://wa.me/${waNumber}?text=${waMessage}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-full transition-all duration-150 active:scale-95 text-text-muted hover:text-emerald-700 font-medium"
        >
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-[#25D366]">
            <MessageCircle size={17} strokeWidth={2.1} />
          </div>
          <span className="text-[9px] uppercase tracking-wider mt-0.5 leading-none">
            Concierge
          </span>
        </a>
      </nav>
    </div>
  );
}
