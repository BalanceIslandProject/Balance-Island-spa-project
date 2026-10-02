'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <footer className="bg-white text-primary pt-12 pb-16 relative border-t border-border/40">
      <div className="max-w-7xl mx-auto px-8 lg:px-12 relative z-10">
        <div className="flex flex-col items-start max-w-2xl">
          
          <div className="mb-8">
            <h2 className="text-xl md:text-2xl font-serif text-primary tracking-wide mb-6">
              A brand of PT BALANCE ISLAND INDONESIA
            </h2>
            <p className="text-[15px] text-text-muted leading-relaxed font-light md:w-[85%] mb-8">
              Bali's premier luxury mobile spa. Bringing 5-star professional massages and organic wellness treatments directly to your private villa or hotel.
            </p>

            <div className="flex flex-col gap-3">
              <span className="text-xs font-bold uppercase tracking-widest text-text-muted">Find us on</span>
              
              <a href="https://share.google/7evzKgW2VdC2C9QWY" target="_blank" rel="noopener noreferrer" className="domain-ubud-only inline-flex items-center gap-2 hover:opacity-80 transition-opacity">
                <img src="https://www.gstatic.com/images/branding/product/2x/maps_48dp.png" alt="Google Maps" className="w-5 h-5 object-contain" />
                <span className="text-sm font-bold text-primary underline decoration-primary/30 underline-offset-4">Elexoir Home Spa</span>
              </a>
              
              <a href="https://share.google/mA7g8NkNuB37g8WHs" target="_blank" rel="noopener noreferrer" className="domain-bali-only inline-flex items-center gap-2 hover:opacity-80 transition-opacity">
                <img src="https://www.gstatic.com/images/branding/product/2x/maps_48dp.png" alt="Google Maps" className="w-5 h-5 object-contain" />
                <span className="text-sm font-bold text-primary underline decoration-primary/30 underline-offset-4">Home Spa Ubud</span>
              </a>
              
              <a href="https://share.google/LRhEtZHpMLBAg9ySs" target="_blank" rel="noopener noreferrer" className="domain-therapick-only inline-flex items-center gap-2 hover:opacity-80 transition-opacity">
                <img src="https://www.gstatic.com/images/branding/product/2x/maps_48dp.png" alt="Google Maps" className="w-5 h-5 object-contain" />
                <span className="text-sm font-bold text-primary underline decoration-primary/30 underline-offset-4">Therapick</span>
              </a>
            </div>
          </div>

          <div className="flex flex-col gap-4 w-full border-t border-border/40 pt-8 mt-4">
            <div className="flex gap-8">
              <Link href="/privacy" className="text-sm md:text-[15px] text-text-muted hover:text-primary transition-colors duration-300">Privacy Policy</Link>
              <Link href="/terms" className="text-sm md:text-[15px] text-text-muted hover:text-primary transition-colors duration-300">Terms of Service</Link>
            </div>
          </div>
          
        </div>
      </div>
    </footer>
  );
}
